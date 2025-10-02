import login from "./login.js";
import register from "./register.js";
import refresh from "./refresh.js";
import me from "./me/index.js";
import forgotPassword from "./forgot-password.js";
import resetPassword from "./reset-password.js";
import changePassword from "./change-password.js";

const auth = {
  login,
  register,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};

export default auth;
