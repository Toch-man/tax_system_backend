import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "email doesnt exist",
      });
    }
    const password_match = await bcrypt.compare(password, user.password);

    if (!password_match) {
      return res.status(401).json({
        success: false,
        message: "invalid password",
      });
    }

    const access_token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15min" },
    );

    const refresh_token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken: refresh_token });

    user.save();
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "login successful",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "something went wrong",
      error,
    });
  }
};

export const sign_up = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        success: false,
        message: "user already exist",
      });
    }

    const hash_password = await bcrypt.hash(password, 10);

    const new_user = new User({
      ...req.body,
    });

    const access_token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15min" },
    );

    const refresh_token = jwt.sign(
      { user_id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    new_user.refreshToken = refresh_token;

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    new_user.save();
    return res.status(201).json({
      success: true,
      message: "successfull created account",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "something went wrong",
      error,
    });
  }
};

export const refresh_token = async (req, res) => {
  const refresh_token = req.cookie.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({
      success: false,
      message: "no refresh token",
    });
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.user_id);

    if (!user || user.refresh_token !== refresh_token) {
      return res.status(403).json({
        success: false,
        message: "invalid token",
      });
    }

    const access_token = jwt.sign(
      {
        user_id: user._id,

        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "new token assigned",
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};
