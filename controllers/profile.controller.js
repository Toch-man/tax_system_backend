import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";

// POST/Create/save profile
export const saveProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await Profile.findOneAndUpdate(
        {
          userId: req.user.id,
        },
        {
          ...req.body,
          userId: req.user.id,
          profileCompleted: true,
        },
        {
          upsert: true, 
          new: true,
        }
      );

    await User.findByIdAndUpdate(
      req.user.id,
      {
        profileCompleted: true,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Profile saved successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET/profile
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};