import userModel from "../model/user.js";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
  try {
    const { email, lastname, firstname, password } = req.body;
    const salt = await bcrypt.genSalt(18);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      email,
      lastname,
      firstname,
      password,
    });
    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Error registering", error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.staus(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "invalid password" });
    }

    return res.status(200).json({ message: "login successful", user });
  } catch (error) {
    return res.status(500).json({ message: "Error registering", error });
  }
};
