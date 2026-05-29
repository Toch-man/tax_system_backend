import userModel from "../model/user.js";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
  try {
    const { email, lastname, firstname, password } = req.body;

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
