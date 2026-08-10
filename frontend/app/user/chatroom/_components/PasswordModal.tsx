import { useState } from "react";

interface PasswordModalProps {
  roomName: string;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

export default function PasswordModal({
  roomName,
  onSubmit,
  onClose,
}: PasswordModalProps) {
  const [inputPassword, setInputPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;
    onSubmit(inputPassword);
    setInputPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm h-60 bg-white p-5 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <h4 className="text-lg font-bold mb-4 text-slate-800">
          輸入密碼進入【{roomName}】
        </h4>
        <p className="mt-1 text-sm text-slate-400">
          此聊天室受密碼保護，請輸入密碼以驗證。
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            placeholder="請輸入房間密碼"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="mb-8 w-full border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-20 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white bg-gray-400 hover:bg-[#9e9d9d] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
            >
              取消
            </button>
            <button
              type="submit"
              className="w-20 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white bg-[#F02A2D] hover:bg-[#e50004] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
            >
              進入房間
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
