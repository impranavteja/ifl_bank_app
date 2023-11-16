const express = require('express');
  const conn = require('./connection');

const session = require('express-session');
const bodyParser = require("body-parser");
const e = require('express');



const app = express();

app.set("view-engine","ejs");
app.use(express.static(__dirname+'/public'))
app.use(bodyParser.urlencoded({ extended: true }));

const defaultSessionSecret = 'mydefaultsecretkey';

app.use(session({
    secret: defaultSessionSecret,
    resave: false,
    saveUninitialized: true
}));


//Branch Dashboard Handling Pages

//branch Admin login code 
app.get("/",(req,res)=>{
    res.render("admin/admin_login.ejs");
})

app.get("/branchlogin",(req,res)=>{
     
    if(req.session.branch){
        res.redirect('/branchdashboard');
    }
    else
    {
        res.render("branch_login.ejs");
    }
})

app.post("/branchlogin",(req,res)=>{
    if(req.session.branch){
        res.redirect('/branchdashboard');
    }
    else{
      conn.query('SELECT * FROM branch_wise_details WHERE branch_id like ? and password like ?',[req.body.username,req.body.pass], (err, rows, fields) => {
        if (!err)
        {
          if(rows.length!=0)
          {
            const jsonRows = JSON.stringify(rows);
            req.session.branch = jsonRows;
            const insertQuery = 'INSERT INTO login_status (id, status, in_time , out_time) VALUES (?, ?, ?,?)';

              conn.query(insertQuery, [req.body.username, 1, new Date() , new Date()], (err, result) => {
                if (err) {
                  // Handle the error, perhaps by showing an error page or message
                  console.log(err);
                

                } else {
                  // Redirect to the branch dashboard after the insertion is successful
                
                  res.redirect('/branchdashboard');
                }
              });
        
          }
          else{
            res.redirect("/branchlogin");
          }
        }
        else
        {
            console.log(err);
            res.redirect("/branchlogin");
        }
        });
    }
})


//branch Admin Dashboard 
app.get("/branchdashboard",(req,res)=>{
    if(req.session.branch)
    {
        rows= JSON.parse(req.session.branch);
        res.render("branch_dashboard.ejs",{rows})
    }
    else
    {
        res.redirect('/branchlogin')
    }
})

//Deposit Form 
app.get("/depositform",(req,res)=>{
  if(req.session.branch)
  {
      rows= JSON.parse(req.session.branch);
      res.render("deposit_form.ejs",{rows})
  }
  else
  {
      res.redirect('/branchlogin')
  }
})
 
//Displays New members List  Joineed Today
app.get("/newmemberslist",(req,res)=>{
  if(req.session.branch)
  {
      rows = JSON.parse(req.session.branch);
      id = String(rows[0].branch_id);
      conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.prosper_code as prosper_code  FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ?  and date(m.doj) = curDate() ORDER BY m.timestamp DESC',[id], (err, rows, fields) => {
        if (!err)
        {
            const mnRows = JSON.stringify(rows);
            const members = JSON.parse(mnRows);
            res.render("mem_list.ejs",{members});
        }
        else
        {
            console.log(err);
            res.redirect("/branchlogin");
        }
        })
      
    }
    else
    {
        res.redirect('/branchlogin')
    }
  })

//Displays New members List  Joineed Today
app.get("/allmemberslist",(req,res)=>{
  if(req.session.branch)
  {
      rows = JSON.parse(req.session.branch);
      id = String(rows[0].branch_id);
      conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.prosper_code as prosper_code  FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ? ',[id], (err, rows, fields) => {
        if (!err)
        {
            const mnRows = JSON.stringify(rows);
            const members = JSON.parse(mnRows);
            res.render("all_mem_list.ejs",{members});
        }
        else
        {
            console.log(err);
            res.redirect("/branchlogin");
        }
        })
      
    }
    else
    {
        res.redirect('/branchlogin')    
    }
  })


// New Active members List 
// app.get("/newactivelist",(req,res)=>{
//   if(req.session.branch)
//   {
//     const date1 = require('date-and-time');
//     conn.query('select m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank, a.prosper_code as prosper_code, m.mobile_no as mobile_no from members m, active_members a where m.branch_code = m.branch_code AND DATE(m.timestamp) = DATE(date1) ORDER BY m.timestamp DESC',(err, rows, fields) => {
//     if (!err)
//     {
//         const mnRows = JSON.stringify(rows);
//         const members = JSON.parse(mnRows);  
//         res.render("account_creation.ejs");
//     }
//     else
//     {
//         console.log(err);
//         res.redirect("/branchlogin");
//     }
//   })
//   }
//   else
//   {
//       res.redirect('/branchlogin')
//   }
// })


//branch Admin Member Creation Form
app.get("/membercreation",(req,res)=>{
    if(req.session.branch)
    { 
        let timestamp = new Date().toLocaleString('en-US', {timeZone: 'Asia/Kolkata'});
        if(timestamp.slice(21,23)=='PM'){
          const sliced = timestamp.slice(12, 14);
          const newValue = 12 + Number(sliced);
          timestamp = timestamp.slice(0, 12) + newValue + timestamp.slice(14,);
        }
        rows= JSON.parse(req.session.branch);
        branch_code = String(rows[0].branch_id);
        const mes = String(rows[0].branch_id) + timestamp.slice(0,6)+ timestamp.slice(8,23);
        const member_code = 'M'+mes.replace(/[\s-:./,PMA]/g,'');
        res.render("mem_creation.ejs",{member_code,branch_code})
    }
    else
    {
        res.redirect('/branchlogin')
    }
})

app.post("/membercreation",(req,res)=>{
  if(req.session.branch)
  {
    try {
      const member_desig = req.body.member_desig;
      const member_name = req.body.member_name;
      const mname = String(member_desig)+ String(member_name);
      const active_code = req.body.member_code;
      const active_code1 = "A" + active_code.slice(1);
      const date1 = new Date().toLocaleString('en-US', {timeZone: 'Asia/Kolkata'});
      const parts = date1.split('/');
      const year = parts[2].split(',');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const formattedDate = `${year[0]}-${month}-${day}`; 
      conn.query('INSERT INTO MEMBERS(branch_code, member_code, member_name, application_number, head_name, post, district, pincode, state, address, aadhar_no, mobile_no, dob, member_age, nominee_name, nominee_age, nominee_relation, nominee_aadhar, nominee_address, active_member_code, m_status, a_status,doj) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [String(req.body.branch_code), String(req.body.member_code),mname, String(req.body.application_number), String(req.body.member_guard), String(req.body.member_post), String(req.body.member_dist), String(req.body.member_pincode), String(req.body.member_state), String(req.body.member_address), String(req.body.aadharid), String(req.body.member_mobile), req.body.member_dob,req.body.member_age, String(req.body.member_nominee), req.body.member_nominee_age, String(req.body.member_relation), String(req.body.aadharid1), String(req.body.nominee_address), active_code1 ,1,0,formattedDate], (err, rows) => 
       {
        if (err){
          console.log(err);
        } 
        if (rows)
        {
        conn.query('INSERT INTO `active_members`(`active_member_id`, `member_id`, `rank`, `prosper_code`,`from_date`, `doa`, `activity`) VALUES (?,?,?,?,?,?,? )',[active_code1,req.body.member_code,1,req.body.prosper_code,formattedDate,formattedDate,0],(err, rows) => {
          if(err){
            console.log(err);
          } 
          if(rows)
          {
            
            res.redirect('/newmemberslist');
          }
        });
        }
      }); 
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Error not inserted');
    }
  }
  else
  {
      res.redirect('/branchlogin')
  }
})

//branch Admin  Active Member Creation Form
app.get("/activemembercreation",(req,res)=>{
    if(req.session.branch)
    {
        res.render("associate_creation.ejs")
    }
    else
    {
        res.redirect('/branchlogin')
    }
})

//branch Admin ACCOUNT Creation Form
app.get("/accountcreation/:id",(req,res)=>{
  if(req.session.branch)
  {
    const {id} = req.params;
    conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ?',[id], (err, rows, fields) => {
      if (!err)
      {
          const mnRows = JSON.stringify(rows);
          const members = JSON.parse(mnRows);
          res.render("account_creation.ejs",{members});
      }
      else
      {
          console.log(err);
          res.redirect("/branchlogin");
      }
      })
    
  }
  else
  {
      res.redirect('/branchlogin')    
  }
})

//branch Admin  Members List
app.get("/memberslist",(req,res)=>{
    if(req.session.branch)
    {
        const mRows = JSON.parse(req.session.branch);

        conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ?',[mRows[0]['branch_id']], (err, rows, fields) => {
            if (!err)
            {
                const mnRows = JSON.stringify(rows);
                const members = JSON.parse(mnRows);
                res.render("branch_members_list.ejs",{members});
            }
            else
            {
                console.log(err);
                res.redirect("/branchlogin");
            }
            })
        
    }
    else
    {
        res.redirect('/branchlogin')
    }
})

//Route Handling For branch Admin Setting ActiveMembers
app.get("/currmemberslist",(req,res)=>{
  if(req.session.branch)
  {
      const mRows = JSON.parse(req.session.branch);

      conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank, a.prosper_code as prosper_code FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ? and m.a_status =  ?',[mRows[0]['branch_id'],1], (err, rows, fields) => {
          if (!err)
          {
              const mnRows = JSON.stringify(rows);
              const members = JSON.parse(mnRows);
              res.render("all_active_members_list.ejs",{members});
          }
          else
          {
              console.log(err);
              res.redirect("/branchlogin");
          }
          })
      
  }
  else
  {
      res.redirect('/branchlogin')
  }
})

//Route Handling For branch Admin Setting ActiveMembers
app.get("/newactivememberslist",(req,res)=>{
  if(req.session.branch)
  {
      const mRows = JSON.parse(req.session.branch);

      conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank, a.prosper_code as prosper_code FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ? and m.a_status =  ? and date(a.from_date) = curDate()',[mRows[0]['branch_id'],1], (err, rows, fields) => {
          if (!err)
          {
              const mnRows = JSON.stringify(rows);
              const members = JSON.parse(mnRows);
              res.render("new_active_members_list.ejs",{members});
          }
          else
          {
              console.log(err);
              res.redirect("/branchlogin");
          }
          })
      
  }
  else
  {
      res.redirect('/branchlogin')
  }
})

//Route Handling For branch Admin Setting ActiveMembers
app.get("/setactivemembers",(req,res)=>{
  if(req.session.branch)
  {
      const mRows = JSON.parse(req.session.branch);

      conn.query('SELECT m.member_code as member_code, m.member_name as member_name, a.active_member_id as active_member_id, a.rank as rank, a.prosper_code as prosper_code FROM members m,active_members a WHERE m.member_code = a.member_id and  m.branch_code like ? and m.a_status =  ?',[mRows[0]['branch_id'],0], (err, rows, fields) => {
          if (!err)
          {
              const mnRows = JSON.stringify(rows);
              const members = JSON.parse(mnRows);
              res.render("set_active_members_list.ejs",{members});
          }
          else
          {
              console.log(err);
              res.redirect("/branchlogin");
          }
          });
      
  }
  else
  {
      res.redirect('/branchlogin')
  }
})

app.post('/setactivemember/:id',(req,res)=> {

  const id = req.params.id;
  const rank = parseInt(req.body.rank);
  console.log(id,rank);
  conn.query('UPDATE members SET a_status = ? WHERE member_code = ?', [1,id], (err, rows) => 
       {
        if (err){
          console.log(err);
        } 
        if (rows)
        {
        conn.query('UPDATE active_members SET rank = ? , activity=?  WHERE member_id = ?',[rank,1,id],(err, rows) => {
          if(err){
            console.log(err);
          } 
          if(rows)
          {
            res.redirect('/setactivemembers');
          }
        });
        }
      });
});


// Create a route to get the chain of a member
// Route handler
app.get('/chainmembers/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      const referrals = await getReferrals(id);
     
      const chain = [];
      const upchain=await getupChain(id);
      
  
      for (let referral of referrals) {
       
        const nestedChain = await getChain(referral.active_member_id);
        chain.push(...nestedChain); 
      }

      
      

      const chain2= []
      for (let refer of chain)
      {
       
        const member = await getDetails(refer);
        chain2.push(...member);
      }
      const chain3= [];
      for (let refer of upchain)
      {
       
        const member = await getupDetails(refer);
        chain3.push(...member);
      }
      res.render('team_wise_details.ejs', { chain2, chain3 });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error getting chain');
    }
  });
  
  
  // Get referrals
  function getReferrals(memberId) {
    return new Promise((resolve, reject) => {
      
      const query = 'SELECT * FROM active_members WHERE prosper_code =(select active_member_id from active_members where member_id = ?)';
  
      conn.query(query, [memberId], (err, rows) => {
        if (err) return reject(err);

        resolve(rows);
        
      }); 
    });
  }

  



  // Get Details
  function getDetails(member) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT m.member_code as member_code, m.member_name as member_name,a.prosper_code as prosper,a.active_member_id as active_member_id, a.rank as rank FROM members m,active_members a WHERE m.member_code = a.member_id and  a.active_member_id  like ?';
      conn.query(query, [member], (err, rows) => {
        if (err) return reject(err);
        mem = JSON.stringify(rows)
        mem_detail = JSON.parse(mem)
        resolve(mem_detail);
        
      }); 
    });
  }
  function getupDetails(member) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT m.member_code as member_code, m.member_name as member_name,a.prosper_code as prosper,a.active_member_id as active_member_id, a.rank as rank FROM members m,active_members a WHERE m.active_member_code = a.active_member_id and  a.member_id  like ?';
      conn.query(query, [member], (err, rows) => {
        if (err) return reject(err);
        mem = JSON.stringify(rows)
        mem_detail = JSON.parse(mem)
        resolve(mem_detail);
        
      }); 
    });
  }
  
  function getReferrals1(memberId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM active_members WHERE prosper_code = ?';
  
      conn.query(query, [memberId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }); 
    });
  }
  
  // Get chain for member
  async function getChain(memberId) {
    
    const referrals = await getReferrals1(memberId);
  
    const chain = [];
  
    for (let referral of referrals) {
      const nestedChain = await getChain(referral.member_id);
      chain.push(...nestedChain);
    }
  
    chain.unshift(memberId);
  
    return chain;
  
  }

  function getupReferrals(memberId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM active_members WHERE active_member_id = (select prosper_code from active_members where member_id = ?)';
      conn.query(query, [memberId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
  
  async function getupChain(memberId) {
    const referral = await getupReferrals(memberId);
    const chain = [];
  
    if (referral.length === 0 || referral[0].prosper_code === 0) {
      chain.push(memberId);
      return chain;
    }
  
    const nestedChain = await getupChain(referral[0].member_id);
    chain.push(...nestedChain);
    chain.unshift(memberId);
  
    return chain;
  }
  
  
//member_creation_form_prosperdetails
app.get('/getprosperName/:prosperid', async (req, res) => {
  try {
    const { prosperid } = req.params;
    console.log(prosperid);
    const query = 'SELECT m.member_name as member_name From members m where m.active_member_code = ? and m.a_status = 1';
    conn.query(query, [String(prosperid)], (err, rows) => {
      if (err) return 'error';
      const mnRows = JSON.stringify(rows);
      console.log(mnRows);
      const prosperName = JSON.parse(mnRows);
      return res.status(200).send(prosperName);

    }); 

  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting chain');
  }
});


//branch Admin Logout
app.get("/branchlogout", (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect("/branchlogin");
        }
    });
});
//  end of  Branch Admin Route Handling Functions


app.get('/networkstatus',(req,res)=>{
  res.sendStatus(200);
})

// ---------------------------------------admin-routes----------------------------------

//admin login code
// Rendering the admin login page
app.get("/adminlogin", (req, res) => {
  if (req.session.admin) {
      res.redirect('/admindashboard');
  } else {
      res.render("admin/admin_login.ejs");
  }
});

// Handling the admin login POST request
app.post("/adminlogin", (req, res) => {
  if (req.session.admin) {
      res.redirect('/admindashboard');
  } else {
      // Replace the SQL query with your actual database query
      conn.query('SELECT * FROM admin WHERE username = ? AND password = ?', [req.body.username, req.body.pass], (err, rows, fields) => {
          if (!err) {
              if (rows.length != 0) {
                  // Store the admin information in the session
                  const jsonRows = JSON.stringify(rows);
                  req.session.admin = jsonRows;

                  res.redirect('/admindashboard');
              } else {
                  // Invalid credentials, redirect back to admin login
                  res.redirect("/adminlogin");
              }
          } else {
              console.log(err);
              res.redirect("/adminlogin");
          }
      });
  }
});

app.get('/admindashboard',(req,res)=>{

  if(req.session.admin)
  {
    rows= JSON.parse(req.session.admin);
    branchesData = {
      "branches": [
        {
          "name": "Branch 1",
          "status": 1
        },
        {
          "name": "Branch 2",
          "status": 0
        },
        {
          "name": "Branch 3",
          "status": 1
        },
        {
          "name": "Branch 4",
          "status": 0
        }
      ]
    }
    
    
    res.render("admin/admin_dashboard.ejs" , { rows : rows , branches: branchesData.branches});
  }
  else {
    res.redirect("/adminlogin");
  }
  
 });
 app.get('/branchcreation', (req, res) => {
  // Fetch data from the Branches table

  if (req.session.admin)
  {
  res.render('admin/branch_creation.ejs');
}
else{
  res.redirect("/adminlogin");
}
});


app.post('/branchcreation', (req, res) => {
  if (req.session.admin) {
    try {
      const branchCode = req.body.branch_code;  
      const branchName = req.body.branch_name;
      const branchAddress = req.body.branch_address;
      const branchDistrict = req.body.branch_district;
      const branchPincode = req.body.branch_pincode;
      const branchState = req.body.branch_state;
      const branchPhone = req.body.branch_phone;
      const branchMobile = req.body.branch_mobile;
      const branchManger = req.body.branch_manager;

      conn.query('INSERT INTO Branches(branch_id, branch_name, branch_address, branch_district, branch_state, branch_pincode, branch_phone, branch_mobile ,branch_manager) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)',
         [branchCode, branchName, branchAddress, branchDistrict, branchState, branchPincode, branchPhone, branchMobile,branchManger], (err, rows) => {
          if (err) throw err;
          res.redirect('/branchlist');
        });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: Branch not inserted');
    }
  } else {
    res.redirect("/adminlogin");
  }
});

app.post('/branchupdate', (req, res) => {
  if (req.session.admin) {
    try {
      const branchCode = req.body.branch_code;  
      const branchName = req.body.branch_name;
      const branchAddress = req.body.branch_address;
      const branchDistrict = req.body.branch_district;
      const branchPincode = req.body.branch_pincode;
      const branchState = req.body.branch_state;
      const branchPhone = req.body.branch_phone;
      const branchMobile = req.body.branch_mobile;

      conn.query('UPDATE Branches SET branch_name = ?, branch_address = ?, branch_district = ?, branch_state = ?, branch_pincode = ?, branch_phone = ?, branch_mobile = ?, branch_manager = ? WHERE branch_id = ?',
      [branchName, branchAddress, branchDistrict, branchState, branchPincode, branchPhone, branchMobile, branchManager, branchCode] , (err, rows) => {
          if (err) throw err;
          res.redirect('/branchlist');
        });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: Branch not inserted');
    }
  } else {
    res.redirect("/adminlogin");
  }
});

app.get('/branchlist', (req, res) => {
  // Fetch data from the Branches table
  if (req.session.admin)
{


  conn.query('SELECT * FROM Branches', (err, branchData) => {
    if (err) {
      console.error('Error querying Branches table:', err);
      res.status(500).send('Error querying database');
      return;
    }

    res.render('admin/branch_detailslist.ejs', { Branchdetails: branchData });
  });
}
else{
  res.redirect("/adminlogin");
}
});

app.get('/branchedit',async(req, res) => {
  // Fetch data from the Branches table or other relevant logic for editing
  // You may need to implement specific logic for editing branches
  if (req.session.admin)
  {
    const branch_id = req.query.id;
  conn.query('SELECT * FROM Branches WHERE branch_id=?',[branch_id], async (err, branchData) => {
    if (err) {
      console.error('Error querying Branches table:', err);
      res.status(500).send('Error querying database');
      return;
    }

    const branchdetails = await getBranches();
    res.render('admin/branch_edit.ejs', { branch: branchData , branchdetails : branchdetails });
  });
}
else{
  res.redirect("/adminlogin");
}
});


const getBranches = async () => {
  return new Promise((resolve, reject) => {
    conn.query('SELECT * FROM Branches', (err, branchData) => {
      if (err) {
        console.error('Error querying Branches table:', err);
        reject(err);
      } else {
        resolve(branchData);
      }
    });
  });
}

const getlatestUser = async () => {
  return new Promise((resolve, reject) => {
    conn.query('SELECT user_id FROM Users ORDER BY user_id DESC LIMIT 1', (err, userData) => {
      if (err) {
        console.error('Error querying Users table:', err);
        reject(err);
      } else {
        if (userData.length > 0) {
          resolve(userData[0].user_id);
        } else {
          // Handle the case when the table is empty
          resolve('EM0'); // You can return a specific value or null
        }
      }
    });
  });
}



app.get('/employeecreation',  async(req, res) => {
  // Fetch data from the Employees table

  if(req.session.admin)

{  
  try{
   const branches = await getBranches();

    res.render('admin/employee_creation.ejs',{branchData : branches});

  }catch(error){
    console.error(error);
    res.status(500).send('Error: Branch not Found');
  }
}
else{
  res.redirect("/adminlogin");
}
});

app.post('/employeecreation',(req,res)=>{
  
  if(req.session.admin)

  {
    try {
      const employee_id = req.body.emp_id;
const employee_name = req.body.emp_name;
const employee_desig = req.body.emp_designation;
const employee_branch = req.body.emp_branch;
const employee_salary = req.body.emp_salary;
const employee_doj = req.body.emp_doj; // Assuming this is the date of joining


conn.query('INSERT INTO Employees(emp_id, emp_name, emp_branch, emp_doj, emp_salary, emp_designation) VALUES (?, ?, ?, ?, ?, ?)',
  [employee_id, employee_name, employee_branch, employee_doj, employee_salary, employee_desig],(err, rows) => {
        if (err) throw err;
        res.redirect('/employeelist');
      });
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error not inserted');

  }

}
else{
  res.redirect("/adminlogin");
}})


app.post('/employeeupdate',(req,res)=>{
  
  if(req.session.admin)

  {
    try {
      const employee_id = req.body.emp_id;
const employee_name = req.body.emp_name;
const employee_desig = req.body.emp_designation;
const employee_branch = req.body.emp_branch;
const employee_salary = req.body.emp_salary;
const employee_doj = req.body.emp_doj; // Assuming this is the date of joining


conn.query('UPDATE Employees SET emp_name = ?, emp_branch = ?, emp_doj = ?, emp_salary = ?, emp_designation = ? WHERE emp_id = ?',
  [employee_name, employee_branch, employee_doj, employee_salary, employee_desig, employee_id],(err, rows) => {
        if (err) throw err;
        res.redirect('/employeelist');
      });
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error not inserted');

  }

}
else{
  res.redirect("/adminlogin");
}})

app.get('/employeelist', (req, res) => {
  // Fetch data from the Employees table
  conn.query('SELECT * FROM Employees', (err, employeeData) => {
    if (err) {
      console.error('Error querying Employees table:', err);
      res.status(500).send('Error querying database');
      return;
    }
    console.log(employeeData);

    res.render('admin/employee_detailslist.ejs', { employees: employeeData });
  });
});

app.get('/employeeedit', async(req, res) => {
  // Fetch data from the Employees table or other relevant logic for editing
  // You may need to implement specific logic for editing employees
  if (req.session.admin)
  { 
    const emp_id = req.query.id;
    console.log(emp_id);
  conn.query('SELECT * FROM Employees WHERE emp_id =?',[emp_id] ,async (err, employeeData) => {
    if (err) {
      console.error('Error querying Employees table:', err);
      res.status(500).send('Error querying database');
      return;
    }
    console.log(employeeData[0]);
    const branchdetails = await getBranches();
    res.render('admin/employee_edit.ejs' , {employee:employeeData , branchdetails:branchdetails});
  });
}
else{
  res.redirect('/adminlogin');
}

});

app.get('/usercreation', async (req, res) => {
  // Fetch data from the Users table
 if (req.session.admin)
 {

  const branchdetails = await getBranches();
  const userID = await getlatestUser() ;
  const prefix = userID.slice(0, 2); // Assuming 'EM' is always the prefix
  const numberPart = parseInt(userID.slice(2)); // Parse the number part to an integer
  const newNumberPart = numberPart + 1; // Increment the number part by 1
  const newUserID = prefix + newNumberPart;
  res.render('admin/user_creation.ejs' , {branchdetails:branchdetails , userID:newUserID});

 }
 else{
  res.redirect("/adminlogin");
 }

});

app.post('/usercreation', (req, res) => {
  if (req.session.admin) {
    try {
      const user_id = req.body.user_id;
      const username = req.body.username;
      const user_password = req.body.password;
      const user_branch = req.body.branch;
      const user_authorization = req.body.authorization;

      conn.query('INSERT INTO Users(user_id, username, user_password, user_branch, user_authorization) VALUES (?, ?, ?, ?, ?)',
        [user_id, username, user_password, user_branch, user_authorization], (err, rows) => {
          if (err) throw err;
          res.redirect('/userlist');
        });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  } else {
    res.redirect("/adminlogin");
  }
});


app.get('/userlist', (req, res) => {
  // Fetch data from the Users table

  if(req.session.admin )
  {
  conn.query('SELECT * FROM Users', (err, userData) => {
    if (err) {
      console.error('Error querying Users table:', err);
      res.status(500).send('Error querying database');
      return;
    }

    res.render('admin/user_detaillist.ejs', { users: userData });
  });
}
else{
   res.redirect("/adminlogin");
}
});

app.get('/useredit', (req, res) => {

  if(req.session.admin )
  {
    const user_id = req.query.id;
    conn.query('SELECT * FROM Users WHERE user_id=?',[user_id], async (err, userData) => {
      if (err) {
        console.error('Error querying Users table:', err);
        res.status(500).send('Error querying database');
        return;
      }
  

      const branchdetails = await getBranches();
      console.log(userData);
      res.render('admin/user_edit.ejs', { user: userData , branch:branchdetails });
    });  

  }
  else{
     res.redirect("/adminlogin");
  }
});


app.post('/userupdate', (req, res) => {
  if (req.session.admin) {
    try {
      const user_id = req.body.user_id;
      const username = req.body.username;
      const user_password = req.body.user_password;
      const user_branch = req.body.user_branch;
      const user_authorization = req.body.user_authorization;

      conn.query('UPDATE Users SET username = ?, user_password = ?, user_branch = ?, user_authorization = ? WHERE user_id = ?',
  [username, user_password, user_branch, user_authorization, user_id], (err, rows) => {
          if (err) throw err;
          res.redirect('/userlist');
        });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  } else {
    res.redirect("/adminlogin");
  }
});


app.get('/activememberbusinessreport', (req, res) => {
  
if(req.session.admin)
{
  res.render('admin/active_member_business_report.ejs');
}
else{
  res.redirect("/adminlogin");
}
});

app.get('/showactivememberbusinessreport', (req, res) => {

  if(req.session.admin){
   res.render('admin/show_active_member_business_report.ejs');
  }
  else{
    res.redirect("/adminlogin");
  }
});


app.get('/activememberpayout', async (req, res) => {

  if(req.session.admin){
    const branchdetails = await getBranches();
   res.render('admin/active_member_payout.ejs',{branchdetails:branchdetails});
  }
  else{
    res.redirect("/adminlogin");
  }
});

app.get('/activememberpayoutlist', async (req, res) => {

  if(req.session.admin){
    const branchdetails = await getBranches();
    const payoutlist =[
      {
          "id": "051022235",
          "name": "₹625000.00",
          "amount": "₹500000.00",
          "spot": "₹500000.00",
          "processing": "₹0.00",
          "total": "₹500000.00"
      }
  ]
  
   res.render('admin/active_member_payout_list.ejs',{branchdetails:branchdetails,payoutlist:payoutlist});
  }
  else{
    res.redirect("/adminlogin");
  }
});


// ==========================SETTINGS====================================

app.get('/plansettings/ipp',(req,res)=>{  
  
  if(1)
  {
    try{

      conn.query('SELECT * FROM  ipp_amounts ORDER BY  category_code', async (err, data) => {
        if (err) throw err;
        console.log(data);
        res.render('admin/plansettings.ejs',{plandetails: data});
    
    })
  }
    catch(error){
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  }
  else{
    res.redirect("/adminlogin");
  }
  
});

app.get('/commissionsettings',(req,res)=>{  
  
  if(req.session.admin)
  {
    res.render('admin/plansettings.ejs');
  }
  else{
    res.redirect("/adminlogin");
  }
  
});

app.get('/ipp_incentives',(req,res)=>{
  if(req.session.admin)
  {
    conn.query('SELECT * FROM ipp_incentives ', async (err, ippData) => {
      if (err) {
        console.error('Error querying Users table:', err);
        res.status(500).send('Error querying database');
        return;
      }

      res.render('admin/ipp_incentives.ejs', { ipp_incentives: ippData });

  })
}
  else{
    res.redirect("/adminlogin");
  }
}
);

app.get('/ipp_incentives_edit',(req,res)=>{
    if(req.session.admin)
    {
      const rank_code = req.query.id;
      conn.query('SELECT * FROM ipp_incentives WHERE rank_code=? ',[rank_code], async (err, ippData) => {
        if (err) {
          console.error('Error querying Users table:', err);
          res.status(500).send('Error querying database');
          return;
        }
        console.log(ippData);
        res.render('admin/ipp_incentives_edit.ejs', { ipp: ippData });
  
    })
  }
    else{
      res.redirect("/adminlogin");

    }
  })

app.post('/ipp_incentives_edit',(req,res)=>{
  if(req.session.admin)
  {
    try{
       const rank_code = req.body.rank_code;
       const tenure = req.body.tenure;
       const percentage = req.body.percentage;
      console.log(rank_code,tenure,percentage);
       conn.query('UPDATE ipp_incentives SET tenure = ?, percentage = ? WHERE rank_code = ?', [tenure, percentage, rank_code], async(err, rows) => {
        if (err) throw err;
        console.log(rows);
        res.redirect('/ipp_incentives');
       
       })}
      
    catch(error){
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  }
  else{
    res.redirect("/adminlogin");
  }
})


app.get('/cdpp_incentives',(req,res)=>{
  if(req.session.admin)
  {
    conn.query('SELECT * FROM cdpp_incentives ', async (err, cdppData) => {
      if (err) {
        console.error('Error querying Users table:', err);
        res.status(500).send('Error querying database');
        return;
      }
      console.log(cdppData)
      res.render('admin/cdpp_incentives.ejs', { cdpp_incentives: cdppData });

  })
}
  else{
    res.redirect("/adminlogin");
  }
}
);

app.get('/cdpp_incentives_edit',(req,res)=>{
    if(req.session.admin)
    {
      const rank_code = req.query.id;
      conn.query('SELECT * FROM cdpp_incentives WHERE rank_code=? ',[rank_code], async (err, cdppData) => {
        if (err) {
          console.error('Error querying Users table:', err);
          res.status(500).send('Error querying database');
          return;
        }
        // console.log(cdppData);
        res.render('admin/cdpp_incentives_edit.ejs', { cdpp: cdppData });
  
    })
  }
    else{
      res.redirect("/adminlogin");

    }
  })

app.post('/cdpp_incentives_edit',(req,res)=>{
  if(req.session.admin)
  {
    try{
       const rank_code = req.body.rank_code;
       const cdpp75 = req.body.cdpp75;
       const cdpp84 = req.body.cdpp84;
       const cdpp108 = req.body.cdpp108;

      console.log(rank_code,tenure,percentage);
       conn.query('UPDATE cdpp_incentives SET CDPP_75 = ?, CDPP_84 = ?, CDPP_108 = ? WHERE rank_code = ?', [cdpp75, cdpp84, cdpp108], async(err, rows) => {
        if (err) throw err;
        // console.log(rows);
        res.redirect('/cdpp_incentives');
       
       })}
      
    catch(error){
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  }
  else{
    res.redirect("/adminlogin");
  }
})




app.get('/late_fee',(req,res)=>{
  
  if(req.session.admin)
  {
     conn.query('SELECT * FROM latefees ', async (err, latefeeData) => {
      if (err)  throw err;
      console.log(latefeeData);
      res.render('admin/late_fee.ejs', { latefee: latefeeData });
     })
  }
  else{
    res.redirect("/adminlogin");
  }
  
});

app.get('/late_fee_edit',(req,res)=>{
  if(req.session.admin )
  {
    const category_code = req.query.id;
    conn.query('SELECT * FROM latefees WHERE category_code=? ',[category_code], async (err, latefeeData) => {
      if (err) {
        console.error('Error querying Users table:', err);
        res.status(500).send('Error querying database');
        return;
      }
      console.log(latefeeData);
      res.render('admin/late_fee_edit.ejs', { latefee: latefeeData });

  })
  }
  else{
    res.redirect("/adminlogin");
  
  }
})

app.post('/late_fee_edit',(req,res)=>{
  if(req.session.admin)
  {
    try{
       const category_code = req.body.category_code;
       const late_fee = req.body.late_fee;
      console.log(category_code,late_fee);
       conn.query('UPDATE latefees SET late_fee = ? WHERE delayed_days = ?', [late_fee, category_code], async(err, rows) => {
        if (err) throw err;
        console.log(rows);  
        res.redirect('/late_fee');
       
       })}
      
    catch(error){
      console.error(error);
      res.status(500).send('Error: User not inserted');
    }
  }
  else{
    res.redirect("/adminlogin");
  }
})

app.get('/test/bond',(req,res)=>{
  res.render('test/invoice.ejs');
});




app.listen(5000, function () {
    console.log('Server started at port 3000');
   })