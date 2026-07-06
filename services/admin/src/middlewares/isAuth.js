import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please Login - No auth header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please Login - Token missing",
      });
    }

    const decodedValue = jwt.verify(token, process.env.JWT_SEC);

    if (!decodedValue || !decodedValue.user) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.user = decodedValue.user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Please Login - JWT error",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Please Login",
    });
  }
};

