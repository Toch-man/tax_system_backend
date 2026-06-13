import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";

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
      { id: user._id,
        role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15min" },
    );

    const refresh_token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    await User.findByIdAndUpdate(user._id, { refresh_token: refresh_token });

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
    const { first_name, last_name, email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        success: false,
        message: "user already exist",
      });
    }

    const hash_password = await bcrypt.hash(password, 10);

    const new_user = new User({
      first_name, last_name, email,
      password: hash_password,
    });

    const access_token = jwt.sign(
      { user_id: new_user._id, role: new_user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15min" },
    );

    const refresh_token = jwt.sign(
      { user_id: new_user._id, role: new_user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    new_user.refresh_token = refresh_token;

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

    await new_user.save();
    return res.status(201).json({
      success: true,
      message: "successfull created account",
      data: new_user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `something went wrong ${error}`,
    });
  }
};

export const refresh_token = async (req, res) => {
  const refresh_token = req.cookies.refresh_token;

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

export const forgot_password = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "if user exist check email fro reset link",
      });
    }

    const raw_token = crypto.randomBytes(32).toString("hex");
    const hashed_token = crypto
      .createHash("sha256")
      .update(raw_token)
      .digest("hex");

    user.reset_token = hashed_token;
    user.reset_token_expires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const reset_url = `${
      process.env.CLIENT_URL
    }/auth/reset_password?token=${raw_token}&email=${encodeURIComponent(
      email,
    )}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: email_error } = await resend.emails.send({
      from: "Tax system <onboarding@resend.dev>", // use this until you verify a domain
      to: email,
      subject: "Reset your  password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #15803d;">Reset your password</h2>
          <p>You requested a password reset for your DevCollab account.</p>
          <p>Click the button below — the link expires in <strong>30 minutes</strong>.</p>
          <a href="${reset_url}"
            style="display:inline-block;margin:16px 0;padding:12px 24px;background:#15803d;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset password
          </a>
          <p style="color:#6b7280;font-size:13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color:#6b7280;font-size:12px;">
            Or copy this link: ${reset_url}
          </p>
        </div>
      `,
    });
    return res
      .status(200)
      .json({ success: true, message: "reset sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reset_password = async (req, res) => {
  const { token, email, new_password } = req.body;
  const hashed_token = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email,
    reset_token: hashed_token,
    reset_token_expires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired reset link" });
  }

  user.password = await bcrypt.hash(new_password, 12);
  user.reset_token = null;
  user.reset_token_expires = null;
  await user.save();

  return res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
};

export const log_out = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (refresh_token) {
      await User.findOneAndUpdate(
        { refreshToken: refresh_token },
        { refreshToken: null },
      );
    }

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Get user profile

export const get_profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refresh_token -reset_token -reset_token_expires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
