const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME;


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({ secret: "your-secret-key", resave: true, saveUninitialized: true })
);

mongoose.connect(
  "mongodb+srv://luongit1:hoangluong123@student.3uxiwwr.mongodb.net/student-management",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB successfully!");
});

app.listen(port, hostname, () => {
  console.log(`Hi ${process.env.AUTHOR}. Server is running on port ${port}`);
});
const Student = require("./models/Student");
const User = require("./models/User");
const requireLogin = (req, res, next) => {
  if (req.session.user) {
    // Nếu đã đăng nhập, cho phép tiếp tục
    next();
  } else {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    res.redirect("/login");
  }
};

// ... (Phần code kết nối MongoDB)

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  console.log("User:", user); // Kiểm tra thông tin người dùng được trả về

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    console.log("Session user:", req.session.user); // Kiểm tra session sau khi đăng nhập
    res.redirect("/dashboard");
  } else {
    console.log("Login failed!");
    res.redirect("/");
  }
});


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();
  res.redirect("/login");
});

app.get("/dashboard",requireLogin, async (req, res) => {
  try {
    if (req.session.user) {
      // Lấy danh sách sinh viên từ MongoDB
      const students = await Student.find();

      // Render trang dashboard và truyền danh sách sinh viên vào
      res.render("dashboard", { user: req.session.user, students });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});


app.post("/addStudent",requireLogin, async (req, res) => {
  try {
    const { id, name, address, phoneNumber, age, grade } = req.body;

    // Tạo một đối tượng sinh viên mới
    const newStudent = new Student({
      id,
      name,
      address,
      phoneNumber,
      age,
      grade,
    });

    // Lưu sinh viên mới vào MongoDB
    await newStudent.save();

    // Redirect lại trang students sau khi thêm thành công
    res.redirect("/students");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.js
app.get("/students",requireLogin, async (req, res) => {
  try {
    // Lấy danh sách sinh viên từ MongoDB
    const students = await Student.find();

    // Render trang students và truyền danh sách sinh viên vào
    res.render("students", { students });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error" + error.message);
  }
});

// Update the route for deleting a student using findByIdAndDelete
app.get("/deleteStudent/:id",requireLogin, async (req, res) => {
  try {
    const studentId = req.params.id;

    // Delete the student from MongoDB based on ID
    await Student.findByIdAndDelete(studentId);

    // Redirect back to the students page after successful deletion
    res.redirect("/students");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/updateStudent/:id", requireLogin,async (req, res) => {
  try {
    const studentId = req.params.id;

    // Lấy thông tin sinh viên từ MongoDB dựa trên ID
    const student = await Student.findById(studentId);

    // Render trang cập nhật sinh viên và truyền thông tin sinh viên vào
    res.render("updateStudent", { student });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/updateStudent/:id",requireLogin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { name, address, phoneNumber, age, grade } = req.body;

    // Cập nhật thông tin sinh viên trong MongoDB dựa trên ID
    await Student.findByIdAndUpdate(studentId, {
      name,
      address,
      phoneNumber,
      age,
      grade,
    });

    // Redirect lại trang students sau khi cập nhật thành công
    res.redirect("/students");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

