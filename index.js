var express=require('express');
var mysql=require('mysql');
var session=require('express-session');
var app=express();
var bodyparser=require('body-parser');
var util=require('util');
var url=require('url');
var upload=require('express-fileupload');
app.use(bodyparser.urlencoded({extended:true}));
app.use(upload());
app.set('veiw engine', 'ejs');
app.use(session({
    secret:'shilpa123',
    resave:true,
    saveUninitialized:true
}));

var con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"foodEcommerce"
});
var exe=util.promisify(con.query).bind(con);
app.use(express.static('Public/'))
app.use(express.static('Public/Images'))


function login(req){
    if(req.session.cust_id==undefined)
    return false;
    else
    return true;

}

function isProductinCart(cart,id){
    for(let i=0;i<cart.length;i++){
        if(cart[i].id == id){
            return true;
        }
    }
    return false;
}

function calculateTotal(cart,req){
    total=0;
    for(let i=0;i<cart.length;i++){
        if(cart[i.price]){
            total=total+(cart[i].price * cart[i].quantity);
        }else{
            total=total + (cart[i].price * cart[i].quantity)
        }
    }
    req.session.total = total;
    return total;
}


//home page
app.get("/",async function(req,res){
   
    var sql="SELECT * FROM admin_addmenu";
    con.query(sql,function(err,result){
        console.log(result);
    res.render("home.ejs",{'result':result});
    });
});

//Admin page
app.get("/admin",function(req,res){
    if(req.session.page_refresh_count == undefined)
    req.session.page_refresh_count
    // console.log(req.session.page_refresh_count);
    var obj={'login':login(req)};
    res.render("admin.ejs",obj);

 });
app.post("/login",async function(req,res){
    sql=`SELECT * from admin WHERE email_id='${req.body.email_id}' 
    AND password='${req.body.password}'`;
    console.log(sql);
    var data=await exe(sql);
    if(data.length>0){
        console.log(data);
        req.session.email_id = data[0].admin_id;
        res.redirect("/vist_dashboard")
    }
    else{
        res.send(`
        <script>
        alert("enter proper details");
        </script>`)
    }
        
});

//Customer
app.get("/Customer_Registration",function(req,res){
    var obj={'login':login(req)};
    res.render("Customer_Registration.ejs",obj);
});
app.post("/customer_form", async function(req,res){
    await exe(`INSERT INTO customer_reg(First_name,Last_name,
        Email,Phone,DateBirth,Password,ConfirmPassword) VALUES ('${req.body.fname}', 
        '${req.body.lname}','${req.body.email}',
        '${req.body.phone}', '${req.body.datebirth}', '${req.body.password}', 
        '${req.body.confirm_password}')`);
        res.redirect("/Customer_Login");
});

app.get("/Customer_Login",function(req,res){
    var obj={'login':login(req)};
    res.render("Customer_Login.ejs",obj);
});
app.post("/Cust_login", async function(req,res){
    var d=req.body;
    sql=`SELECT * from customer_reg WHERE Email='${d.email}'
     AND ConfirmPassword='${d.password}'`;
    console.log(sql);
    var data=await exe(sql);
    if(data.length>0){
        console.log(data);
        req.session.cust_id = data[0].cust_id;
       res.redirect("/Restaurant")
    }
    else{
        res.send("login failed!!!")
    }
        
        
    });


    //Menu
app.get("/admin_addmenu",function(req,res){
    res.render("admin_addmenu.ejs");
 });
app.post("/dashboard",async function(req,res){
        
        console.log(req.files);
        console.log(req.body);
        var file_name=req.files.Image.name;
        req.files.Image.mv('Public/Images/'+file_name);
        var sql=`INSERT INTO ADMIN_ADDMENU (food_name,category,sub_category,Restaurant_name,
            price,description,food_image) VALUES ('${req.body.food_name}', '${req.body.Category}',
            '${req.body.sub_category}','${req.body.restaurant}','${req.body.price}',
            '${req.body.description}','${file_name}')`;
        await exe(sql);
       
        res.redirect("/print_menu");
});
app.get("/print_menu",async function(req,res){
    var Menu_data=await exe(`SELECT * FROM ADMIN_ADDMENU`);
    var obj={'list':Menu_data}
    console.log(Menu_data)
    res.render("Print_menu.ejs",obj);
   
});


//Restaurant add
app.get("/RestaurantAdd",function(req,res){
    res.render("Restaurants_add.ejs");
});
app.post("/restaurantAdd",async function(req,res)
{
    var file_name=req.files.restaurant_image.name;
        req.files.restaurant_image.mv('Public/Images/'+file_name);
    await exe(`INSERT INTO restaurant_add(Restaurant_name,Restaurant_category,
        Restaurant_Description,Restaurant_image) VALUES ('${req.body.restaurant_name}', 
        '${req.body.restaurant_category}','${req.body.restaurant_description}',
        '${file_name}')`);
        res.redirect("/Print_restaurant");
})

app.get("/Print_restaurant",async function(req,res){
    var Restaurant_data=await exe(`SELECT * FROM restaurant_add`);
    var obj={'list':Restaurant_data}
    console.log(Restaurant_data)
    res.render("print_restaurants.ejs",obj);
}); 

app.get("/edit_restaurant/:id",async function(req,res){
    id=req.params.id;
    var Restaurant_data=await exe(`SELECT * FROM restaurant_add WHERE restaurant_id='${id}'`);
    // res.send(Restaurant_data);
    var obj={"re_det":Restaurant_data};
    res.render("edit_restaurants.ejs",obj)
});
app.post("/update_restaurants",async function(req,res){
    var file_name=req.files.restaurant_image.name;
        req.files.restaurant_image.mv('Public/Images/'+file_name);
     var d=req.body;
    var sql=`UPDATE RESTAURANT_ADD SET restaurant_name='${d.restaurant_name}',
    restaurant_category='${d.restaurant_category}',
    restaurant_description='${d.restaurant_description}',restaurant_image='${file_name}'
      WHERE restaurant_id='${d.restaurant_id}'`;
    await exe(sql);
    // res.send(sql);
     res.redirect("/Print_restaurant")
});
//dashboard
app.get("/vist_dashboard",function(req,res){
    res.render("dashboard.ejs");
});

  //Restauarnt Page  
app.get("/Restaurant",function(req,res){
    var obj={'login':login(req)};
    res.render("Restaurant.ejs",obj);
});

app.get("/menu_list1",function(req,res){
    var obj={'login':login(req)};
    res.render("boobies_burger.ejs",obj);
});


app.get("/menu_list2",function(req,res){
    var obj={'login':login(req)};
    res.render("menu_list2.ejs",obj);
});

app.get("/chicken_biryani",function(req,res){
    var obj={'login':login(req)};
    res.render("chicken&biryani.ejs",obj);
});

app.get("/french_house",function(req,res){
    var obj={'login':login(req)};
    res.render("frenchhouse.ejs",obj);
});

app.get("/drinks1",function(req,res){
    var obj={'login':login(req)};
    res.render("drinks1.ejs",obj);
});
app.get("/drinks2",function(req,res){
    var obj={'login':login(req)};
    res.render("drinks2.ejs",obj);
});
app.get("/All1",function(req,res){
    var obj={'login':login(req)};
    res.render("All1.ejs",obj);
});
app.get("/All2",function(req,res){
    var obj={'login':login(req)};
    res.render("All2.ejs",obj);
});

app.get("/Desert",function(req,res){
    var obj={'login':login(req)};
    res.render("Desert.ejs",obj);
});

app.post("/add_to_cart",function(req,res){
    var id=req.body.id;
    var food_name=req.body.food_name;
    var description=req.body.description;
    var price=req.body.price;
    var quantity=req.body.quantity;
    var food_image=req.body.food_image;
    var product={id:id,food_name:food_name,description:description,price:price,
    quantity:quantity,food_image:food_image}

    if(req.session.cart){
        var cart=req.session.cart;
        if(!isProductinCart(cart,id)){
            cart.push(product);
        }

    }else{
        req.session.cart = [product];
        var cart=req.session.cart;
    }

    //calculate
    calculateTotal(cart,req);

    res.redirect('/cart')
});

app.get("/cart",function(req,res){
    var cart=req.session.cart;
    var total=req.session.total;
    res.render("cart.ejs",{cart:cart,total:total});
});

app.post("/remove_product",function(req,res){
    var id=req.body.addmenu_id;
    var cart=req.session.cart;
    for(let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            cart.splice(cart.indexOf(i),1);
        }
    }
    calculateTotal(cart,req);
    res.redirect("/cart");
});

app.get("/checkout",function(req,res){
    var total = req.session.total
    res.render("checkout.ejs",{total:total});
    
});

app.post("/place_order",function(req,res){

    // var name=req.body.name;
    // var email=req.body.email;
    // var phone=req.body.phone;
    // var price=req.body.price;
    // var city=req.body.city;
    // var address=req.body.address;
    // var price=req.session.total;
    // var status="not paid";
    // var date=new Date();
    // var addmenu_id = addmenu_id + "," +cart[i].id;

    // var con=mysql.createConnection({
    //     host:"localhost",
    //     user:"root",
    //     password:"",
    //     database:"foodEcommerce"
    // });

    // var cart= req.session.cart;
    // for(let i=0;i<cart.length;i++){
    //     addmenu_id=addmenu_id+cart[i].id;
    // }
     
    // con.connect((err)=>{
    //     if(err){
    //         console.log(err);

    //     }else{
    //         var query="INSERT INTO order(Price,Cust_name,email,status,city,address,phone,date,addmenu_id) VALUES ?";
    //         var values = [
    //             [ price,name,email,status,city,address,phone,date,addmenu_id]
    //     ];
    //     con.query(query,[values],(err,result)=>{

    //         res.redirect("/payment");
    //     });
    //     }
    // })
    res.redirect("/payment");
});

app.get("/payment",function(req,res){
    res.render("payment.ejs");
})
app.listen(2090);