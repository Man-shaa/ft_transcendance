import { useContext, useEffect, useRef, useState } from 'react';
import { FaRegPenToSquare, FaUser, FaVolumeXmark } from 'react-icons/fa6';
import { SlOptions } from 'react-icons/sl';
import { RiGamepadFill } from 'react-icons/ri';
import { LuBadgePlus } from "react-icons/lu";
import { Link, useNavigate } from 'react-router-dom';
import { setSelectedChannelId } from '../../services/selectedChannelSlice';
import { useDispatch } from 'react-redux';
import { FaMinusCircle } from 'react-icons/fa';
import { WebSocketContext } from '../../socket/socket';
import 	axios from '../../axios/api';
import { setGameData, setInvitedFriend } from '../../services/gameInvitSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@react-three/fiber';


interface Owner {
    username: string;
	avatar: string;
	id: number;
}

interface ChannelProps {
	channel: {
		members: Users[];
		modes: string;
		chanId: number;
		name: string;
		owner: Owner;
		op: string[];
	}
	user: Users,
	onMuteUser: (mutedUserId: number, user: Users) => void;
	onUpdateList: (newList: Users[]) => void;	
	block: Users[]
}

interface Users {
	username: string;
	avatar: string;
	id: number;
	status: string;
}

const UserConvOptions: React.FC<ChannelProps> = ({ 
	channel,
	user,
	onMuteUser,
	block,
	onUpdateList 
	}) => {

	const [popinOpen, setPopinOpen] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const dispatch = useDispatch();
	const [isBlocked, setIsBlocked] = useState<boolean>(false);
	const [isMuted, setIsMuted] = useState<boolean>(false);
	const socket = useContext(WebSocketContext);
	const [userData, setUserData] = useState<{username: string}>({ username: '' });
	const navigate = useNavigate();
	const invitedFriend = useSelector((state: RootState) => state.gameInvit.invitedFriend);

	useEffect(() => {
		const fetchData = async () => {
		try {
			const userDataResponse = await axios.get('/users/me');
			setUserData(userDataResponse.data);
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
		};
		fetchData();
	}, []);

	const togglePopin = () => {
		setPopinOpen(!popinOpen);
	};

	const handleAddOp = () => {
		socket.emit('addOp', { chanId: channel.chanId, username: user.username });
		setPopinOpen(!popinOpen);
	};

	const handleRemoveOp = () => {
		socket.emit('removeOp', { chanId: channel.chanId, username: user.username });
		setPopinOpen(!popinOpen);
	};

	const handleClick = () => {
	if (channel.op.find(opMember => opMember === user.username)) {
		handleRemoveOp();
	} else {
		handleAddOp();
		}
	};

	useEffect(() => {
	const handleClickOutside = (event: MouseEvent) => {
		if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
			setPopinOpen(false);
		}
	};
	document.addEventListener("mousedown", handleClickOutside);
	return () => {
		document.removeEventListener("mousedown", handleClickOutside);
	};
	}, []);

	useEffect(() => {
		axios
		.get(`friends-list/blocked-users/${user.id}`)
		.then((response) => {
			setIsBlocked(response.data.isBlocked);
		})
		.catch((error) => {
			console.error('Error fetching data:', error);
		});

		socket.emit("findAllMutedMembers", { chanId: channel.chanId });
		socket.on("allMuted", (users) => {
		if (users.map((user: Users) => user.id).includes(user.id))
			setIsMuted(true)
		});
	}, [user.id, socket]);

	const handleClickSendMessage = () => {
		socket.emit('getOrCreateChatChannel', { username2: user.username, id: user.id }); 
		socket.on('chatChannelCreated', (data) => {
			dispatch(setSelectedChannelId(data.channelId));
		});
	}

	const handleClickBan = () => {
		socket.emit('banUser', { chanId: channel.chanId, username: user.username }); 
		socket.on('userBanned', (data) => {
		});
		setPopinOpen(!popinOpen);
	}

	const handleClickKick = () => {
		socket.emit('kickUser', { chanId: channel.chanId, username: user.username }); 
		socket.on('userKicked', (data) => {
		});
		setPopinOpen(!popinOpen);
	}

	{/*MUTE FUNCTIONS*/}
	const handleClickMute = async () => {
		try {
			if (isMuted) {
				await unMuteUser();
				setIsMuted(false);
				onMuteUser(user.id, user);
			} else {
				await muteUser();
				setIsMuted(true);
				onMuteUser(user.id, user);
			}
		} catch (error) {
			console.error('Erreur lors du blocage:', error);
		}
		setPopinOpen(!popinOpen);
	}

	const unMuteUser = async () => {
		socket.emit("unMuteMember", { chanId: channel.chanId, userId: user.id });
		socket.on("memberUnMuted", (users) => {
		})
	};

	const muteUser = async () => {
		socket.emit("muteMember", { chanId: channel.chanId, userId: user.id });
		socket.on("memberMuted", (users) => {
		});

	};

	const invitToPlay = async (user) => {
		if (!invitedFriend)
		{
			dispatch(setInvitedFriend(user));
		
				const sendNotification = async () =>
				{
					await axios.post(`/notification/add/${user.id}`, { fromUser: userData?.username , type: 2, fromUserId: userData?.id});
					socket.emit("all-update")
				}
				sendNotification();
		
				const createInviteGame = async () =>
				{
					socket.emit("createInviteGame", user.id);
					socket.on("gameInviteData", (game) =>
					{
						if (game)
							dispatch(setGameData(game));
					});
				navigate('/game')
				}
		
				createInviteGame();
		}
	}

	const handleBlockUser = async (user: Users) => {
		try {
			if (isBlocked) {
				await unblockUser(user.id);
				const updatedUsers = block.filter(user => user.id !== user.id);
				onUpdateList(updatedUsers)
				setIsBlocked(false);

			} else {
				await blockUser(user.id);
				onUpdateList([...block, user])
				setIsBlocked(true);
			}
		} catch (error) {
			console.error('Erreur lors du blocage ou deblocage de l\'utilisateur :', error);
		}
	};
	
	const blockUser = async (userId: number) => {
		try {
			await axios.post(`/friends-list/block/${userId}`);
		} catch (error) {
			console.error('Erreur lors du blocage de l\'utilisateur :', error);
		}
	};

	const unblockUser = async (userId: number) => {
		try {
		await axios.post(`/friends-list/unblock/${userId}`);
		} catch (error) {
		console.error("Error deblocked users:", error);
		}
	};

	return (
	<div>
		<button
		className="flex flex-row text-lilac items-center"
		onClick={togglePopin}
		>
		<SlOptions className="w-3 h-3"/>
		</button>
		{popinOpen && (
		<div className="">
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"></div>
			<div ref={cardRef} className="absolute top-4 right-0 z-50">
				<div className="bg-dark-violet text-lilac rounded-lg px-6 py-5">
					<Link to={`/user/${user.username}`}>
						<div className="flex flex-row items-center pb-1 hover:opacity-40">
							<FaUser size={10}/>
							<p className="ml-2">See profile</p>
						</div>
					</Link>
					<div
						style={{ cursor: "pointer" }} 
						className="flex flex-row items-center pb-1 hover:opacity-40"
						onClick={handleClickSendMessage}
					>
						<FaRegPenToSquare size={11}/>
						<p className="ml-2">Send a message</p>
					</div>
					<div
						className={`flex flex-row items-center pb-1 hover:opacity-40 ${invitedFriend ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
						onClick={() => invitToPlay(user)}
					>
						<RiGamepadFill size={11}/>
						<p className="ml-2">Invite to play</p>
					</div>
					{(channel.op.find(opMember => opMember === userData.username) || userData.username === channel.owner.username) && (
					<>
					<div className='border-t border-lilac my-2 w-2/3 m-auto border-opacity-50'></div>
					
					<div className="grid grid-cols-2 gap-2">
						<div
							style={{ cursor: "pointer" }}
							onClick={handleClickMute}
							className="flex flex-row items-center hover:opacity-40"
						>
							<FaVolumeXmark size={10} />
							<p className={`ml-2 ${isMuted ? 'text-red-500' : ''}`}>{isMuted ? 'Unmute' : 'Mute'}</p>
						</div>
						<div
							style={{ cursor: "pointer" }} 
							onClick={handleClickKick}
							className="flex flex-row items-center hover:opacity-40"
						>
							<FaRegPenToSquare size={11} />
							<p className="ml-2">Kick</p>
						</div>
						<div 
							style={{ cursor: "pointer" }}
							onClick={() => handleBlockUser(user)}
							className="flex flex-row items-center hover:opacity-40"
						>
							<FaMinusCircle size={11} />
							<p className={`ml-2 ${isBlocked ? 'text-red-500' : ''}`}>{isBlocked ? 'Unblock' : 'Block'}</p>
						</div>
						<div 
							style={{ cursor: "pointer" }} 
							onClick={handleClickBan}
							className="flex flex-row items-center hover:opacity-40"
						>
							<RiGamepadFill size={11} />
							<p className="ml-2 ">Ban</p>
						</div>
					</div>
					

					{user.username !== channel.owner.username && (
						<div>
							<div className='border-t border-lilac my-2 w-2/3 m-auto border-opacity-50'></div>
							<div className="flex flex-row items-center cursor-pointer" onClick={handleClick}>
								<LuBadgePlus size={11} />
								{channel.op && channel.op.find((opMember => opMember === user.username)) ? (
									<p className="ml-2 text-red-orange">Remove as admin</p>
								) : (
									<p className="ml-2">Register as admin</p>
								)}
						</div>
						</div>
					)}
				</>	
				)}
				</div>
			</div>
		</div>
		)}
	</div>
	);
};

export default UserConvOptions;