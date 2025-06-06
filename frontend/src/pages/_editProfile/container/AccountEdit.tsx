import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineMail, AiOutlineUser } from "react-icons/ai";
import { FaUser } from "react-icons/fa6";
import axios from "../../../axios/api";
import FileUpload from "../../../components/photo/FileUpload";
import { useNavigate } from "react-router-dom";
import { WebSocketContext } from "../../../socket/socket";
import { useDispatch } from "react-redux";
import { setLogout } from "../../../services/UserSlice";

interface IdataRegister {
  username: string;
  email: string;
}

interface Users {
  username: string;
  email?: string;
  avatar: string;
  id: number;
  status: string;
}

const AccountEdit = () => {
  const socket = useContext(WebSocketContext);
  const [error, setError] = useState<string>();
  const [userData, setUserData] = useState<Users>();
  const navigate = useNavigate();
	const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { isValid },
    watch,
  } = useForm<IdataRegister>();

  const { username, email } = watch();

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

  const submitHandler = async () => {
    try {
      const filteredData: Partial<IdataRegister> = {};

      if (username) {
        filteredData.username = username;
      }

      if (email) {
        filteredData.email = email;
      }

      await axios.patch("/users/edit", filteredData);
      socket.emit("all-update");
      navigate("/");
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Email or username already taken");
    }
  };

  const handleDeleteAccount = async () => {
    try {
			dispatch(setLogout());
      await axios.delete("/users/delete-user");
      socket.emit("all-update");
      navigate("/sign-in");
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return (
    <div className="my-4 mx-2 relative h-full">
      {/*TITLE*/}
      <div className="text-lilac">
        <h2>Profile and account</h2>
        <p className="text-xs">Manage profile preferences</p>
      </div>

      {/*PHOTO*/}
      <div className="text-lilac mt-4 flex flex-row items-center">
        {userData && userData.avatar ? (
          <img
            src={userData.avatar}
            className="h-20 w-20 object-cover rounded-full text-lilac"
            alt="User Avatar"
          />
        ) : (
          <div className="bg-purple rounded-full p-2 mt-2">
            <FaUser className="w-[60px] h-[60px] p-3 text-lilac" />
          </div>
        )}
        <div>
          {userData && (
            <FileUpload
              userData={userData}
              setUserData={
                setUserData as (newUserData: Users | undefined) => void
              }
            />
          )}
        </div>
      </div>

      {/*CHANGE*/}
      <form onSubmit={handleSubmit(submitHandler)} className="mt-6">
        <div className="flex flex-row w-60 items-center border-lilac border-b">
          <AiOutlineUser className="w-4 h-4 text-lilac" />
          <input
            type="text"
            id="name"
            {...register("username", {
              minLength: {
                value: 1,
                message: "Name length must be at least 1 character:",
              },
            })}
            placeholder={userData?.username}
            className="px-5 py-3 text-sm text-lilac placeholder-lilac placeholder-opacity-40 bg-transparent outline-none"
          />
        </div>

        <div className="flex flex-row w-60 items-center border-b border-lilac">
          <AiOutlineMail className="w-4 h-4 text-lilac" />
          <input
            type="email"
            id="email"
            {...register("email", {
              pattern: {
                value:
                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                message: "Please enter a valid email",
              },
            })}
            placeholder={userData?.email ? userData.email : "Enter an email"}
            className="px-5 py-3 text-sm text-lilac placeholder-lilac placeholder-opacity-40 bg-transparent outline-none"
          />
        </div>
        {error && <p className="text-xs pt-2 text-red-orange">{error}</p>}
        <button
          type="submit"
          disabled={!isValid}
          className="mt-4 text-sm bg-dark-violet text-lilac py-2 px-5 rounded mb-6 disabled:opacity-40"
        >
          Save changes
        </button>
      </form>

      {/*DELETE ACCOUNT*/}
      <p
        className="text-xs text-red-orange underline"
        style={{ cursor: "pointer" }}
        onClick={handleDeleteAccount}
      >
        Delete Account
      </p>
    </div>
  );
};

export default AccountEdit;
