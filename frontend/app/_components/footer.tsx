import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faInstagram,
	faXTwitter,
	faFacebook,
	faYoutube,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
	return (
		<footer className="w-full bg-black border-t text-slate-300">
			<div className="max-w-7xl mx-auto px-5 py-5">
				<div className="flex flex-col md:flex-row md:justify-between gap-8">
					<div className="max-w-xs">
						<h3 className="text-white font-bold text-lg font-pixel">
							About Us
						</h3>
						<p className="mt-2 text-xs leading-5">
							Real & Delicious
							<br />
							探索美食，聰明消費，享受每一刻。
						</p>
					</div>

					{/* Contact */}
					<div>
						<h3 className="text-white font-bold text-lg font-pixel">
							Contact Us
						</h3>
						<div className="mt-2 space-y-1 text-xs">
							<p>Email：realicious2026@gmail.com</p>
							<p>電話：(02) 6631-6588</p>
							<p>地址：台北市復興南路一段390號2樓</p>
						</div>
					</div>

					{/* Social */}
					<div>
						<h3 className="text-white font-bold text-lg font-pixel">
							Follow Us
						</h3>
						<div className="flex gap-5 mt-2">
							<a
								href="https://zh.wikipedia.org/zh-tw/%E5%87%B1%E6%96%87%C2%B7%E6%96%AF%E7%89%B9%E7%BE%85%E5%A7%86"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Instagram"
							>
								<FontAwesomeIcon
									icon={faInstagram}
									className="text-xl hover:text-white transition cursor-pointer"
								/>
							</a>
							<a
								href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnrHq0J2JvulRp4mpBrBzW0kiFFy8dTas9Zm9Hc0OkuMhRsQ7w3Rzi--U&s=10"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="X"
							>
								<FontAwesomeIcon
									icon={faXTwitter}
									className="text-xl hover:text-white transition cursor-pointer"
								/>
							</a>
							<a
								href="https://memeprod.ap-south-1.linodeobjects.com/user-template/0561d9e8e54e0c8872811993944bdb95.png"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Facebook"
							>
								<FontAwesomeIcon
									icon={faFacebook}
									className="text-xl hover:text-white transition cursor-pointer"
								/>
							</a>
							<a
								href="https://youtu.be/dQw4w9WgXcQ?si=c8CUhuHZn8wxbrRn"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Youtube"
							>
								<FontAwesomeIcon
									icon={faYoutube}
									className="text-xl hover:text-white transition cursor-pointer"
								/>
							</a>
						</div>
					</div>
				</div>
				<div className="border-t border-slate-800 mt-4 pt-3 text-xs text-center text-slate-500">
					© 2026 Realicious. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
