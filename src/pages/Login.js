import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(Math.floor(Math.random() * 10) + 1);
  const [userCaptcha, setUserCaptcha] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios
      .get("http://localhost:3001/register")
      .then((res) => {
        console.log(res.data);
      })
      .catch((error) => {
        console.error("Error fetching users", error);
      });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (parseInt(userCaptcha) !== captcha + 3) {
      Swal.fire({
        title: "Error",
        text: "Captcha does not match!",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/login", {
        email,
        password,
      });
      const { token, message, role } = response.data;

      Swal.fire({
        title: "Success",
        text: `${message} ${role}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setEmail("");
      setPassword("");
      setUserCaptcha("");
      setCaptcha(Math.floor(Math.random() * 10) + 1);
      navigate("/account");
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.error || "Login failed";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg py-5">
      <div className="container flex flex-col mx-auto bg-white rounded-lg pt-12 my-5">
        <div className="flex justify-center w-full h-full my-auto xl:gap-14 lg:justify-normal md:gap-5 draggable">
          <div className="flex items-center justify-center w-full lg:p-12">
            <div className="flex items-center xl:p-10">
              <form
                className="flex flex-col w-full h-full pb-6 text-center bg-white rounded-3xl"
                onSubmit={handleLogin}
              >
                <h3 className="mb-12 text-4xl font-extrabold text-dark-grey-900">
                  Log In
                </h3>
                <label
                  htmlFor="email"
                  className="mb-2 text-sm text-start text-grey-900 font-medium"
                >
                  Email*
                </label>
                <input
                  className="flex items-center w-full px-5 py-4 mr-2 text-sm font-medium outline-none focus:bg-grey-400 mb-7 placeholder:text-grey-700 bg-grey-200 text-dark-grey-900 rounded-2xl border-2 border-gray-300"
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label
                  htmlFor="password"
                  className="mb-2 text-sm text-start text-grey-900 font-medium"
                >
                  Password*
                </label>
                <input
                  className="flex items-center w-full px-5 py-4 mr-2 text-sm font-medium outline-none focus:bg-grey-400 mb-7 placeholder:text-grey-700 bg-grey-200 text-dark-grey-900 rounded-2xl border-2 border-gray-300"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label className="mb-2 text-sm text-start text-grey-900 font-medium">
                  Captcha: {captcha} + 3 = ?
                </label>
                <input
                  className="flex items-center w-full px-5 py-4 mr-2 text-sm font-medium outline-none focus:bg-grey-400 mb-7 placeholder:text-grey-700 bg-grey-200 text-dark-grey-900 rounded-2xl border-2 border-gray-300"
                  type="text"
                  placeholder="Captcha"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                />
                <button
                  className="w-full px-6 py-5 mb-5 text-sm font-bold bg-blue-500 leading-none text-white transition duration-300 md:w-96 rounded-2xl hover:bg-sky-blue-600 focus:ring-4 focus:ring-sky-blue-100 bg-sky-blue-500"
                  type="submit"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
