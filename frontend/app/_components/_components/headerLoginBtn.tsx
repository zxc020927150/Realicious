"use client";

import Cookies from "js-cookie";

import UserSidebar from "./userSidebar";
import ChatroomSidebar from "./chatroomSidebar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";
import { useUser } from "@/app/context/user";

interface HeaderLoginBtnProps {
	token: boolean;
	className?: string;
}

export default function HeaderLoginBtn({
	className,
	token,
}: HeaderLoginBtnProps) {
	// 用有沒有token來判斷是否登入，接後端後是需求或安全性可能需要更改判斷條件
	// const token = (Cookies.get("token") ? true :false)
	const { user } = useUser();
	return (
		<div className={`text-black ${className}`}>
			{user ? (
				<div className="flex gap-x-2 items-center justify-end">
					<ChatroomSidebar />
					<UserSidebar />
				</div>
			) : (
				<div className="flex gap-x-2 items-center justify-end text-white font-medium ">
					<Link
						href={"/user/login"}
					>
						<FontAwesomeIcon icon={faUser} className="text-xl mr-2" />
						<span>登入</span>
					</Link>
				</div>
			)}
		</div>
	);
}
