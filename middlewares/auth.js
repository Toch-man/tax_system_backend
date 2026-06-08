import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  const access_token = req.cookies.access_token;

  if (!access_token) {
    return res.status(403).json({
      success: false,
      message: "no token provided",
    });
  }
  try {
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "invalid token",
    });
  }
};
