import { useContext, useEffect, useState } from "react";
import { FaUser } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { setSelectedChannelId } from "../../../services/selectedChannelSlice";
import { WebSocketContext } from "../../../socket/socket";
import { useSelector } from "react-redux";
import { RiGamepadFill } from "react-icons/ri";
import { RootState } from "../../../store/store";
import TimeConverter from "../../../components/date/TimeConverter";
import axios from "../../../axios/api";
interface Member {
	username: string;
	avatar: string;
	id: number;
	status: string;
}


interface Message {
	content: string;
	createdAt: string;
	authorId: string;
}

interface Channel {
	name: string;
	modes: string;
	chanId: number;
	members: Member[];
	messages: Message[];
	owner: User;
}

interface User {
	username: string;
	avatar: string;
	id: number;
	status: string;
}

const PersoConv = () => {
	const [allChannel, setAllChannel] = useState<Channel[]>([]);
	const dispatch = useDispatch();
	const socket = useContext(WebSocketContext);
	const id = useSelector((state: RootState) => state.selectedChannelId);
	const [userData, setUserData] = useState<{username: string}>({ username: '' });

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

	const handleChannelClick = (channelId: number) => {
		dispatch(setSelectedChannelId(channelId));
	};


	useEffect(() => {
		socket.emit("find-my-channels");
		socket.on("my-channel-list", (channelList) => {
		setAllChannel(channelList);
		});

		return () => {
		socket.off("my-channel-list");
		};
	}, [allChannel, socket]);

	useEffect(() => {
		socket.emit("last-message", allChannel);
		socket.on("last-channel-mesage", (channelList) => {
		setAllChannel(channelList);
    });

	
	return () => {
		socket.off("my-channel-list");
	};
	}, [allChannel, socket]);


	const renderLastMessage = (channel: Channel) => {
		if (channel.messages.length > 0) {
		const lastMessage = channel.messages[channel.messages.length - 1];
		const chanName = (lastMessage.authorId === userData.username) ? 'me' :  lastMessage.authorId;
		return (
			<>
				<p className="text-sm pt-1 text-lilac text-opacity-60">
					{(chanName.length + lastMessage.content.length) > 16
					? (chanName + ': ' + lastMessage.content).slice(0, 16) + "..."
					: chanName + ': ' + lastMessage.content}
				</p>
				<TimeConverter initialDate={lastMessage.createdAt.toLocaleString()} />
			</>
		);
		} else {
		return (
			<p className="text-sm pt-1 text-lilac text-opacity-60">No messages</p>
		);
		}
	};

	return (
	<div className="pl-1 md:pl-5">
		{/* USER */}
		{allChannel
			.filter((channel) => channel.modes === "CHAT")
			.map((channel, index) => (
			<div
			key={index}
			className={` ${
				channel.chanId === id.selectedChannelId ? 'bg-filter rounded-l-md pb-1' : 'pb-1'
			}`}
			onClick={() => handleChannelClick(channel.chanId)}
			style={{ cursor: "pointer" }}
			>
			<div className="flex flex-row h-12 mb-2.5 pl-1 pr-2 md:pl-0.5 md:pr-0 md:mx-2 ">
				<div className="relative mt-2 h-full rounded-full grid justify-items-center items-center md:mr-4">

					{channel.members.filter(member => member.username !== userData.username) && channel.members.filter(member => member.username !== userData.username)[0].avatar ? (
						<div>
							<img
								src={channel.members.filter(member => member.username !== userData.username)[0].avatar}
								className="h-[48px] w-[48px] object-cover rounded-full text-lilac"
							/>
						</div>			
					) : (
						<div className="relative w-full h-full md:w-[45px] md:h-[45px] bg-purple rounded-full grid justify-items-center items-center">
							<FaUser className="text-lilac" />
						</div>
					)}

					{channel.members.filter(member => member.username !== userData.username) && channel.members.filter(member => member.username !== userData.username)[0].status === 'ONLINE' ? (
					<div className="absolute bg-acid-green w-3 h-3 rounded-full right-0 bottom-0.5"></div>
					) : channel.members.filter(member => member.username !== userData.username) && channel.members.filter(member => member.username !== userData.username)[0].status === 'OFFLINE' ? (
					<div className="absolute w-3 h-3 rounded-full right-0 bottom-0.5"></div>
					) : 
					<div className="absolute bg-fushia w-3 h-3 rounded-full right-0 bottom-0.5 flex items-center justify-center">
						<RiGamepadFill className="text-white w-2 h-2"/>
					</div>
					}

				</div>


				<div className="pt-3 hidden md:block">
					{/*CHAN NAME*/}
					<div className="flex flex-row justify-between">
						<p className="text-base text-lilac">
						{channel.members.filter(member => member.username !== userData.username)[0].username}
						</p>
					</div>

					{/*LAST MESSAGE*/}
					<div className="flex flex-row justify-between w-[140px]">
						{renderLastMessage(channel)}
					</div>
				</div>
			</div>
			</div>
			))}
		</div>
	);
};

export default PersoConv;
