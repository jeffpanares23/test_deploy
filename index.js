const express = require('express')
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt')
const port = 5000
// standard for express
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("default route");

  res.send("Hello World!");
})

// db con
const db = mysql.createConnection({
  user: 'root',
  host: 'localhost',
  password: '',
  database: 'academy'
});

///////////// FETCH / READ QUERY /////////////
// fetchUser 
app.get('/fetchUser', (req, res) => {
  db.query("SELECT * FROM usertbl", (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.send(result)
    }
  })
})

//fetchCourse
app.get('/fetchCourse', (req, res) => {
  db.query("SELECT * FROM course_tbl", (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.send(result)
    }
  })
})

//fetchQuiz
app.get('/fetchQuiz/:moduleId', (req, res) => {
  const moduleId = req.params.moduleId;

  const query = "SELECT * FROM module_exam_tbl WHERE moduleId = ?";

  db.query(query, [moduleId], (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.send(result)
    }
  })
})

//fetchModuleContent
app.get('/fetchModuleContent/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM module_content_tbl WHERE moduleId = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    }
    else {
      res.send(result);
    }
  });
});

//fetchSingleModule 
app.get('/fetchSingleModule/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM module_tbl WHERE id = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    }
    else {
      res.send(result);
    }
  });
});

//fetchBookmark ID
app.get('/fetchBookmark/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM bookmark_tbl where user_id =${id}`, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.send(result)
    }
  })
})

//fetchModule ID
app.get('/fetchModule/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM module_tbl WHERE course_id = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    } else {
      db.query(`SELECT * FROM module_content_tbl WHERE moduleID = ${id}`, (err, innerResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('An error occurred');
        } else {
          res.send({
            modules: result,
            moduleContent: innerResult
          });
        }
      });
    }
  });
});

////////////// GET QUERY ///////////////////
//user ID
app.get('/user/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM usertbl WHERE Id = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('An error occurred');
    } else {
      res.send(result);
    }
  });
});

//singleCourse ID
app.get('/singleCourse/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM course_tbl
              JOIN module_tbl ON module_tbl.course_id = course_tbl.id
              WHERE course_tbl.id = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'An error occurred' });
    } else {
      db.query(`SELECT * FROM usertbl WHERE Id = ${id}`, (err, innerResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('An error occurred');
        } else {
          res.send({
            modules: result,
            moduleContent: innerResult
          });
        }
      });;
    }
  });
});

//content ID
app.get('/content/:id', (req, res) => {
  const { id } = req.params;

  db.query(`SELECT * FROM module_content_tbl 
      JOIN module_tbl ON module_tbl.id = module_content_tbl.moduleId 
      WHERE moduleId = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('An error occurred');
    }

    db.query(`SELECT * FROM course_tbl WHERE Id = ${id}`, (err, innerResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send('An error occurred');
      }

      res.send({ moduleContent: result, courseData: innerResult });
    });
  });
});

//bookmark ID
app.get('/bookmark/:id', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM bookmark_tbl WHERE id = ${id}`, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.send(result)
    }
  })
})

//savedCourses ID
app.get('/savedCourses/:id', (req, res) => {
  const { id } = req.params;
  // Query bookmark_tbl to retrieve saved courses for the specific user_id
  db.query('SELECT * FROM bookmark_tbl WHERE user_id = ?', [id], (err, bookmarkResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching saved courses.' });
    }
    // Extracting the 'course_id' values into a new array
    const savedCourseIds = bookmarkResult.map((row) => row.course_id);
    if (savedCourseIds.length === 0) {
      // No saved courses for the user, return an empty array
      return res.send([]);
    }
    // Query course_tbl to fetch course details for the savedCourseIds
    const queryString = 'SELECT * FROM course_tbl WHERE id IN (?)';
    db.query(queryString, [savedCourseIds], (err, courseResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching course details.' });
      }
      // Combine the bookmark and course details
      const combinedResult = bookmarkResult.map((bookmarkRow) => {
        const matchingCourse = courseResult.find((courseRow) => courseRow.id === bookmarkRow.course_id);
        return {
          ...bookmarkRow,
          course_details: matchingCourse,
        };
      });

      res.send(combinedResult);
      // console.log(combinedResult);
    });
  });
});

/////////////////////////POST QUERY//////////////////////////
//login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  db.query("SELECT * FROM usertbl WHERE Email = ?;",
    email,
    (err, result) => {
      if (err) {
        res.status(500).send({ message: 'An error occurred during login' });
        return;
      }
      if (result && result.length > 0) {
        bcrypt.compare(password, result[0].Password, (error, response) => {
          if (response) {
            res.send(result);
          } else {
            res.send({ message: 'Wrong email/password combination!' });
          }
        });
      } else {
        res.send({ message: "User doesn't exist" });
      }
    }
  );
});

// ADD QUIZ 
app.post('/Addquiz', (req, res) => {
  const { id, examContent } = req.body;

  db.query('INSERT INTO module_exam_tbl (moduleID, examContent) VALUES (?, ?)',
    [id, examContent], // Convert the examContent JSON object to a string
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error inserting quiz data.");
      } else {
        console.log("Quiz data inserted successfully.");
        res.status(200).send("Quiz data inserted successfully.");
      }
    }
  );
});

////////////// INSERT/CREATE QUERY ///////////////
app.post('/insert', (req, res) => {
  const Name = req.body.Name
  const Codename = req.body.Usercodename
  const Teamname = req.body.Userteamname
  const Interest = req.body.Userinterest
  const Email = req.body.Useremail
  const Password = req.body.Userpassword
  const Status = req.body.Userstatus
  const Role = req.body.Userrole

  db.query('INSERT INTO usertbl (Name, Codename, Teamname, Email, Password, Interest, Status, Role) VALUES (?,?,?,?,?,?,?,?)',
    [Name, Codename, Teamname, Email, Password, Interest, Status, Role],
    (err, result) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    }
  )
});

//BOOKMARK ADDED //
app.post('/bookmark', (req, res) => {
  const { course_id, user_id } = req.body;

  db.query('INSERT INTO bookmark_tbl (course_id, user_id) VALUES (?, ?)',
    [course_id, user_id],
    (err, result) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    }
  )
});

app.post('/insertContentmodule', (req, res) => {
  const id = req.body.id
  const content = req.body.content

  db.query('INSERT INTO module_content_tbl (moduleID, content) VALUES (?,?)',
    [id, content],
    (err, result) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    }
  )
});




/////////////// UPDATE QUERY ////////////////
// Update query
app.put('/updateUser/:id', (req, res) => {
  const { id } = req.params;
  const updatedRow = req.body;

  db.query(
    'UPDATE users SET name = ?, email = ?, profile_image_url = ?, cover_photo_url = ?, about_me = ? WHERE Id = ?',
    [
      updatedRow.name,
      updatedRow.email,
      updatedRow.profile_image_url,
      updatedRow.cover_photo_url,
      updatedRow.about_me,
      id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'An error occurred' });
      } else {
        res.send('User updated');
      }
    }
  );
});

//DELETE QUERY
// Endpoint to delete a course by its ID
app.delete('/deleteCourse/:id', (req, res) => {
  const courseId = req.params.id;

  db.query(`DELETE FROM bookmark_tbl WHERE course_id = ${courseId}`, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error deleting course from the database.' });
    } else {
      if (result.affectedRows > 0) {

      } else {
        return res.status(404).json({ error: 'Course not found.' });
      }
    }
  });
});

// delete query
app.delete('/deleteUser/:id', (req, res) => {
  const { id } = req.params;
  db.query(`DELETE FROM usertbl WHERE Id = ${id}`, (err, result) => {
    if (err) {
      console.log(err)
      res.status(500).json({ error: 'An error occurred' });
    } else {
      res.send(result)
    }
  })
});

app.listen(8000, () => {
  console.log('running on port 8000');
})

// app.listen(process.env.PORT || port, () => console.log('running on port $(port)'));