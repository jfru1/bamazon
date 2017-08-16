var sqlDB = require("./sqlConnect.js")
var cliTable = require("cli-table")
var inquirer = require("inquirer")

//init application, this is the store's main screen
storeSplash();

function storeSplash(){
	console.log(
`
___________________________________________________________
                 
           Welcome to the Bamazon Marketplace
        Please have a look at the listed items below
___________________________________________________________
`
		);

	//build the table under the header
	var table = new cliTable({
		head: ['ID', 'Product', 'Price in USD', 'Quantity'],
	});
	//create an array to hold ID values for all items
	var idArray = [];
	//ask the database to populate the list with all the data we need
	mysql.query('select * from products', function(error, res, fields){
		if (error) throw error;
		for (var j = 0; j < res.length; j++){
			var tableRow = []
			//populate table with id, name, price, and quantity
			tableRow.push(res[j].item_id,res[j].product_name,res[j].price,res[j].stock_quantity);
			//push the filled out table row
			table.push(tableRow);
			//then add the item id to the premade array
			idArray.push(res[j].item_id);
		}
		//print the pushed rows to the table for user
		console.log(table.toStrong());
		customerBuy(idArray);
	});
}

//this function grabs customer input
function customerBuy(array){
	inquirer.prompt([
	{
		name:"productid",
		type:"input",
		message:"Please enter the ID of the desired item: ",
	},
	{
		name:"productQuant",
		type:"input",
		message:"How many would you like to buy?",
		default: 1,
	}]).then(function(choice){
		var prodid = parseInt(choice.productID);
		var prodquant = parseInt(choice.productQTY);
		//both values entered must e numbers, if not fail
		if(isNaN(prodid)||isNan(prodquant)){
			console.log("Please enter numeric values!")
			//jump back to start of function
			customerBuy();
		}else{
			//if both value are numbers, make sure they're correct numbers
			if(array.indexOf(prodid)===-1){
				console.log("This ID doesn't match a product!")
				customerBuy(array)
			}else{
				checkQuant(prodid, prodquant, array)
			}
		}
	})
}

//make sure there's enough of the item to sell, then do the math on it
function checkQuant(id, qty, array){
	mysql.query('select * from products where item_id=?', id, function(error, res, fields){
		if (error) throw error;

		var remainingQty = res[0].stock_quantity - qty;
		var priceItem = res[0].price;
		//var departmentID = res[0].department_id
		var productID = id
		//are there any more of that item in stock?
		if (remainingQty < 0){
			console.log("That item is sold out!")
			customerBuy(array);
		}else{
			//if passes, move to do math
			var totalPrice = priceItem*qty;
			updateSale(productID,totalPrice);
			completeOrder(productID, remainingQty, totalPrice)
		}
	})
}

function completeOrder(id, qty, price){
	mysql.query('update products set stock_quantity = ? where item_id = ?',[qty, id], function(error, res, fields){
		if (error) throw error;
			console.log(
				`
				___________________________________________________________
				Thank you for your patronage. Your total is: $ ${[price.toFixed(2)]}
				___________________________________________________________
				`
				)
			continueShop();
	})
}

//asks the customer if they'd like to continue shopping
function continueShop(){
	inquirer.prompt([
	{
		name: 'continueShop',
		type: 'list',
		choices:['Yes', 'No'],
		message: 'Would you like to keep shopping?'
	}
	]).then(function(answer){
		if(answer.continueshop === "Yes"){
			storeSplash();
		} else {
			mysql.end();
		}
	})
}

function updateSale(productID,totalPrice){
	mysql.query("select product_sales from products where item_id= ?", productID, (err, res, fields)=>{
		if (err) throw err;
		var currentTotal = res[0].product_sales;
		var updatedTotal = currentTotal + totalPrice;

		mysql.query("update products set product_sales= ? where item_id= ?", [updatedTotal, productID], (err, res, fields)=>{
			if (err) throw err;
		})
	})
}