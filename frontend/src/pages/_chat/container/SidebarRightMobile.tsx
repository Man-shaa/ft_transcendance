import {
  FaBan,
  FaUser,
  FaUserGroup,
  FaVolumeXmark,
  FaXmark,
} from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import { RiGamepadFill } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "../../../axios/api";
import UserConvOptions from "../../../components/popin/UserConvOptions";
import { WebSocketContext } from "../../../socket/socket";
import { setGameData, setInvitedFriend } from "../../../services/gameInvitSlice";
import axiosInstance from "../../../axios/api";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "@react-three/fiber";

interface RightSidebarProps {
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  onUpdateList: (newList: Users[]) => void;
  block: Users[];
  channel: {
    members: Users[];
    modes: string;
    chanId: number;
    name: string;
    owner: Owner;
    op: string[];
    muted: number[];
    banned: Users[];
  };
}

interface Users {
  username: string;
  avatar: string;
  id: number;
  status: string;
}

interface Owner {
  username: string;
  avatar: string;
  id: number;
}

interface Channel {
  name: string;
  modes: string;
  chanId: number;
  owner: Owner;
  members: Users[];
  op: Users[];
}

const SidebarRightMobile: React.FC<RightSidebarProps> = ({
  isRightSidebarOpen,
  toggleRightSidebar,
  channel,
  block,
  onUpdateList,
}) => {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
	const [channelInCommon, setChannelInCommon] = useState<Channel[]>([]);
  const [commonChannelCount, setCommonChannelCount] = useState(0);
  const [usersInChannelExceptHim, setUsersInChannelExceptHim] = useState<
    Users[]
  >([]);
  const [commonFriendsCount, setCommonFriendsCount] = useState(0);
  const [usersInFriends, setUsersInFriends] = useState<Users[]>([]);
  const [showCommonFriends, setShowCommonFriends] = useState(false);
  const [showCommonChannel, setShowCommonChannel] = useState(false);

  const [showBanUser, setShowBanUser] = useState(false);
  const [usersMute, setUsersMute] = useState<Users[]>([]);
  const socket = useContext(WebSocketContext);
  const [userData, setUserData] = useState<{ username: string; id: number }>({
    username: "",
    id: -1,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
	const invitedFriend = useSelector((state: RootState) => state.gameInvit.invitedFriend);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDataResponse = await axios.get("/users/me");
        setUserData(userDataResponse.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, []);

  type ChannelEquivalents = {
    [key: string]: string;
  };

  const channelEquivalents: ChannelEquivalents = {
    GROUPCHAT: "Public",
    PRIVATE: "Private",
    PROTECTED: "Protected",
  };

  const channelName: string = channel.modes;
  const displayText: string = channelEquivalents[channelName];

  channel.members.sort((a, b) => {
    if (channel.owner.username === a.username) {
      return -1;
    } else if (channel.owner.username === b.username) {
      return 1;
    } else {
      return 0;
    }
  });

  const toggleCommonFriends = () => {
    setShowCommonFriends(!showCommonFriends);
  };

  const toggleCommonChannel = () => {
    setShowCommonChannel(!showCommonChannel);
  };

  const toggleBanUser = () => {
    setShowBanUser(!showBanUser);
  };

  useEffect(() => {
    if (channel.chanId !== null) {
      socket.emit("users-in-channel-except-him", { chanName: channel.name });
      socket.on("users-in-channel-except-him", (users) => {
        setUsersInChannelExceptHim(users);
      });

      socket.emit("findAllMutedMembers", { chanId: channel.chanId });
      socket.on("allMuted", (users) => {
        setUsersMute(users);
      });

      socket.emit("channel-in-common", { chanId: channel.chanId });
      socket.on("channel-in-common", (channels) => {
        setChannelInCommon(channels);
        setCommonChannelCount(channels.length);
      });
      socket.emit("friends-in-common", { chanId: channel.chanId });
      socket.on("friends-in-common", (friends) => {
        setUsersInFriends(friends);
        setCommonFriendsCount(friends.length);
      });

      socket.emit("check-user-in-channel", { chanId: channel.chanId });
      socket.on("user-in-channel", (boolean) => {});

      return () => {
        socket.off("allMembers");
        socket.off("allMembers");
        socket.off("allMembersBan");
        socket.off("user-in-channel");
      };
    }
  }, [socket, channel.chanId, channel.name, channel.modes]);

  const updateUsersMute = (mutedUserId: number, user: Users) => {
    const isUserMuted = usersMute.some((user) => user.id === mutedUserId);

    if (isUserMuted) {
      const updatedUsers = usersMute.filter((user) => user.id !== mutedUserId);
      setUsersMute(updatedUsers);
    } else {
      setUsersMute((prevUsers) => [...prevUsers, user]);
    }
  };

  useEffect(() => {
    if (
      Array.isArray(usersInChannelExceptHim) &&
      usersInChannelExceptHim.length > 0 &&
      usersInChannelExceptHim[0]?.id
    ) {
      axios
        .get(`friends-list/in-common/${usersInChannelExceptHim[0].id}`)
        .then((response) => {
          setCommonFriendsCount(response.data.length);
          setUsersInFriends(response.data);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
    if (
      Array.isArray(usersInChannelExceptHim) &&
      usersInChannelExceptHim.length > 0 &&
      usersInChannelExceptHim[0]?.id
    ) {
      axios
        .get(`friends-list/blocked-users/${usersInChannelExceptHim[0].id}`)
        .then((response) => {
          setIsBlocked(response.data.isBlocked);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  }, [usersInChannelExceptHim]);

  const handleJoinChannel = async () => {
    socket.emit("joinChan", { chanId: channel.chanId });
    socket.on("channelJoined", () => {});
  };

  const handleBlockUser = async (user: Users) => {
    try {
      if (isBlocked) {
        await unblockUser(user.id);
        const updatedUsers = block.filter((user) => user.id !== user.id);
        onUpdateList(updatedUsers);
        setIsBlocked(false);
      } else {
        await blockUser(user.id);
        onUpdateList([...block, user]);
        setIsBlocked(true);
      }
    } catch (error) {
      console.error(
        "Erreur lors du blocage ou deblocage de l'utilisateur :",
        error
      );
    }
  };

  const blockUser = async (userId: number) => {
    try {
      await axios.post(`/friends-list/block/${userId}`);
      socket.emit("all-update");
    } catch (error) {
      console.error("Erreur lors du blocage de l'utilisateur :", error);
    }
  };

  const unblockUser = async (userId: number) => {
    try {
      await axios.post(`/friends-list/unblock/${userId}`);
      socket.emit("all-update");
    } catch (error) {
      console.error("Error deblocked users:", error);
    }
  };

  const unBanUser = async (username: string) => {
    try {
      socket.emit("unBanUser", { chanId: channel.chanId, username: username });
      socket.on("userUnBanned", (users) => {});
    } catch (error) {
      console.error("Error deblocked users:", error);
    }
  };

  const invitToPlay = async (user) => {
    if (!invitedFriend)
    {
      dispatch(setInvitedFriend(user));

      const sendNotification = async () =>
      {
        await axiosInstance.post(`/notification/add/${user.id}`, { fromUser: userData?.username , type: 2, fromUserId: userData?.id});
        socket.emit("all-update")
      }
      sendNotification();


      socket.emit("createInviteGame", user.id);
      socket.on("gameInviteData", (game) =>
      {
        if (game)
          dispatch(setGameData(game));
      });
      navigate('/game')
    }
  }

  return (
    <div
      className={`absolute h-[80vh] top-0 right-0 w-[260px] md:rounded-r-lg bg-violet-black p-4 text-gray-300 text-xs ${
        isRightSidebarOpen ? "block" : "hidden"
      }`}
    >
      {/*CLOSE*/}
      <button className="flex-end" onClick={toggleRightSidebar}>
        <FaXmark className="w-4 h-4 text-lilac" />
      </button>

      {channel.modes === "CHAT" && (
        <div>
          {usersInChannelExceptHim.map((member, index) => {
            if (member.username !== null) {
              return (
                <div key={index}>
                  <div className="relative flex flex-col items-center">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        className="h-[86px] w-[86px] object-cover rounded-full text-lilac"
                        alt="User Avatar"
                      />
                    ) : (
                      <div className="bg-purple rounded-full p-2 mt-2">
                        <FaUser className="w-[80px] h-[80px] p-3 text-lilac" />
                      </div>
                    )}

                    {member.status === "ONLINE" ? (
                      <div className="absolute bg-acid-green  w-5 h-5 rounded-full left-32 bottom-6"></div>
                    ) : member.status === "OFFLINE" ? (
                      <div className="absolute w-5 h-5 rounded-full left-32 bottom-6"></div>
                    ) : member.status === "INGAME" ? (
                      <div className="absolute bg-fushia w-5 h-5 rounded-full left-32 bottom-6 flex items-center justify-center z-50">
                        <RiGamepadFill className="text-white w-3 h-3" />
                      </div>
                    ) : null}

                    <p key={index} className="text-sm text-lilac pt-2">
                      {member.username}
                    </p>
                  </div>

                  <nav className="mt-4">
                    <ul className="text-lilac">
                      <li
                        className="hover:opacity-40"
                        style={{ cursor: "pointer" }}
                      >
                        <Link to={`/user/${member.username}`}>
                          <div className="flex flex-row items-center">
                            <FaUser className="w-3 h-3 mr-2" />
                            <p className="pt-1">See Profile</p>
                          </div>
                        </Link>
                      </li>
                      {!isBlocked && (
                        <li
                          className={`hover:opacity-40 ${invitedFriend ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                          onClick={() => invitToPlay(member)}
                        >
                            <div className="flex flex-row items-center mt-1">
                              <RiGamepadFill className="w-3 h-4 mr-2" />
                              <p className="hover:underline">Invite to play</p>
                            </div>
                        </li>
                      )}
                      <li
                        className="hover:opacity-40 mt-1"
                        onClick={() => handleBlockUser(member)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="flex flex-row items-center mt-1">
                          <FaBan
                            className={`w-3 h-3 mr-2 ${
                              isBlocked ? "text-red-500" : ""
                            }`}
                          />
                          <p className={` ${isBlocked ? "text-red-500" : ""}`}>
                            {isBlocked ? "Unblock" : "Block"}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </nav>
                </div>
              );
            }
            return null;
          })}

          <div className="flex flex-col justify-end space-y-2 px-2 py-2 mt-4 rounded-lg bg-purple">
            <div
              onClick={toggleCommonFriends}
              className="flex flex-row justify-between items-center cursor-pointer"
            >
              <div className="text-xs text-lilac">
                {commonFriendsCount} common friends
              </div>
              <IoIosArrowForward className="w-2 h-2 text-lilac" />
            </div>
            {showCommonFriends && (
              <div>
                {usersInFriends.map((friend) => (
                  <div key={friend.id}>
                    <Link
                      to={`/user/${friend.username}`}
                      className="text-lilac"
                    >
                      {friend.username}
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-lilac"></div>
            <div
              onClick={toggleCommonChannel}
              className="flex flex-row justify-between items-center cursor-pointer"
            >
              <div className="text-xs text-lilac">
                {commonChannelCount} common channels
              </div>
              <IoIosArrowForward className="w-2 h-2 text-lilac" />
            </div>
            {showCommonChannel && (
              <div className="text-xs" >
                {channelInCommon.map((channel) => (
                  <div onClick={() => handleNavigation(channel.chanId)}
				  	className="w-full m-auto text-left rounded px-1 hover:bg-dark-violet cursor-pointer">
                    <div key={channel.name}>
                      <div className="flex flex-row py-1 h-full justify-content m-auto items-center">
                        <div className="w-[20px] h-[20px] bg-lilac rounded-full grid items-center items-center">
                          <FaUserGroup className="w-6 h-2 text-purple pr-1" />
                        </div>
                        <p className="w-full text-lilac font-regular ml-2">
                          {channel.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/*GROUP*/}
      {channel.modes !== "CHAT" && (
        <div>
          <div className="flex flex-col items-center">
            <div className="w-[80px] h-[80px] mt-2 bg-purple rounded-full grid justify-items-center items-center">
              <FaUserGroup className="w-[30px] h-[30px] text-lilac" />
            </div>
            <p className="text-sm text-lilac pt-2">{channel.name}</p>
            <p className="text-xs text-lilac pt-2">
              {displayText} - {channel.members.length} members
            </p>
          </div>
          {channel.members.every(
            (member) => member.username !== userData.username
          ) &&
            channel.modes === "GROUPCHAT" && (
              <div className="flex flex-col justify-end p-2 mt-4 mx-4 rounded-lg bg-purple">
                <div
                  onClick={handleJoinChannel}
                  style={{ cursor: "pointer" }}
                  className="flex flex-row justify-between items-center w-full"
                >
                  <div className="text-xs text-lilac">Join group</div>
                  <IoIosArrowForward className="w-2 h-2 text-lilac" />
                </div>
              </div>
            )}
          <div className="mt-6">
            {channel.members.map((member, index) => {
              return (
                <div
                  key={index}
                  className="relative flex justify-between items-center mx-4 mt-2"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-[20px] h-[20px] bg-purple rounded-full grid justify-items-center items-center 
							${channel.owner.username === member.username ? "border-2 border-fushia" : ""}
							${
                channel.op.find((opMember) => opMember === member.username)
                  ? "border-2 border-acid-green"
                  : ""
              }
						`}
                    >
                      {member.avatar ? (
                        <div>
                          <img
                            src={member.avatar}
                            className="h-[16px] w-[16px] object-cover rounded-full text-lilac"
                          />
                        </div>
                      ) : (
                        <FaUser className="text-lilac w-[8px] h-[8px]" />
                      )}
                    </div>
                    <p className="text-xs text-lilac ml-2">{member.username}</p>

                    {member.status === "ONLINE" ? (
                      <div className="absolute bg-acid-green w-1.5 h-1.5 rounded-full left-3.5 top-3.5"></div>
                    ) : member.status === "OFFLINE" ? (
                      <div className="absolute w-1.5 h-1.5 rounded-full left-3.5 top-3.5"></div>
                    ) : member.status === "INGAME" ? (
                      <div className="absolute bg-fushia w-1.5 h-1.5 rounded-full left-3.5 top-3.5 flex items-center justify-center">
                        <RiGamepadFill className="text-white w-1 h-1" />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-row text-lilac">
                    {channel.muted.map((user) => user).includes(member.id) && (
                      <FaVolumeXmark size={10} className="mr-2" />
                    )}
                    {channel.members
                      .map((user) => user.id)
                      .includes(member.id) &&
                      member.id !== userData.id && (
                        <UserConvOptions
                          channel={channel}
                          user={member}
                          onMuteUser={updateUsersMute}
                          block={block}
                          onUpdateList={onUpdateList}
                        />
                      )}
                  </div>
                </div>
              );
            })}

            {/*BAN USER*/}
            <div className="mx-4 flex flex-col justify-end space-y-2 px-2 py-2 mt-4 rounded-lg bg-purple">
              <div
                onClick={toggleBanUser}
                className="flex flex-row justify-between items-center cursor-pointer"
              >
                <div className="text-xs text-lilac">
                  {channel.banned ? channel.banned.length : 0} banned members
                </div>
                <IoIosArrowForward
                  className={`w-2 h-2 text-lilac ${showBanUser && "rotate-90"}`}
                />
              </div>
              {showBanUser && (
                <div>
                  {channel.banned &&
                    channel.banned.map((ban) => (
                      <div
                        key={ban.id}
                        className="text-red-orange flex items-center justify-between"
                      >
                        {ban.username}
                        <button
                          className="ml-1"
                          onClick={() => unBanUser(ban.username)}
                        >
                          {(channel.op.find(
                            (opMember) => opMember === userData.username
                          ) ||
                            userData.username === channel.owner.username) && (
                            <FaXmark className="w-2 h-2 text-red-orange" />
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarRightMobile;
