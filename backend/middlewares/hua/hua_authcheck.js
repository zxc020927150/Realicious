// 判斷是否是登入狀態
export const authcheck = (req,res,next)=>{
  if(req.session.user){
    next();
  }else{
    req.session.returnTo = req.originalUrl;
    req.flash('error', '您尚未登入！');
    res.redirect("/login");
  }
};

// 登入頁判斷是否是登入狀態
export const authcheck_login = (req,res,next)=>{
  if(req.session.user){
    req.flash('error','請您先登出再進行登入');
    next();
    }else{
    next();
    }
  }
// 判斷是否是管理員
export const isAdmin = (req, res, next) => {
  if (req.session.user.role <= 1) {
    next();
  } else {
    req.session.returnTo = req.originalUrl;
    req.flash('error', `帳號或密碼錯誤！(權限不足)`);
    res.redirect("/login");
  }
};