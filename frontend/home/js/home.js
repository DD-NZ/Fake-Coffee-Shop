$(document).ready(function(e) {
    const URL = "https://nwen-project.herokuapp.com";
    //const URL = "http://localhost:8080";
    $("#purchases").hide();
    $("#cart").hide();
    $("#adminnav").hide();
    $("#admin").hide();
    $("#addProducts").hide();
    $("#deleteProducts").hide();
    $("#editOrders").hide();
    loadList();
    checkLogIn();
    checkAdmin();


    /* Nav buttons
    --------------------------------*/

    //Login buton. If user is not logged in, it will direct to the login page
    //If user is logged in it will display as 'Logout' and will log the user out when pressed
    $('#loginBtn').on('click', function() {
        if ($('#loginBtn').html() == 'Login') {
            window.location.href = URL + "/login";
        } else {
            $.ajax({
                method: 'POST',
                url: URL + '/logout',
                success: function(data) {
                    $('#login').html('Login');
                    $("#purchases").hide();
                    $("#cart").hide();
                    $("#products").show();
                }
            });
        }
    });

    //when products button is pushed, it will show the products section
    //and hide all other sections on the page.
    $('#productsBtn').on('click', function() {
        $("#purchases").hide();
        $("#cart").hide();
        $("#products").show();
    });

    // hides all other sections and shows users cart section
    // loads the users cart from the server.
    $('#cartBtn').on('click', function() {
        $("#purchases").hide();
        $("#products").hide();
        $('#cart').show();
        loadCartList();
    });

    // hides all other sections and shows users order history
    // loads the users order history from the server.
    $('#orderHistory').on('click', function() {
        $("#products").hide();
        $("#cart").hide();
        $("#purchases").show();
        loadPurchaseList();
    });

    // Checks wether the user has a session with the server and is authenticated.
    function checkLogIn() {
        $.ajax({
            method: 'GET',
            url: URL + '/authenication',
            success: function(data) {
                //if has a session with server, changes the login button to log out
                $('#login').html('Logout');
            }
        });
    }

    // checks wether or not the user is logged in as the adminsistrator
    // if so hides all the regular user  nav buttons, and shows the adminsistrator nav buttons.
    function checkAdmin() {
        $.ajax({
            method: 'GET',
            url: URL + '/adminAuthenication',
            success: function(data) {
                $("#adminnav").show();
                $("#admin").show();
                $("#addProducts").show();

                $("#usernav").hide();
                $("#products").hide();
                $("#purchases").hide();
                $("#cart").hide();
            }
        })
    }

    /* Products
    --------------------------------*/

    //search input for the products section
    //re-loads the list every time a new character is inputted
    $('#search').on('input', function() {
        loadList();
    });

    // gets all the products from the server and displays them on the page
    function loadList() {
        //empty all products from the section to re add them
        $("#productList").empty();
        $.ajax({
            method: 'GET',
            url: URL + '/products',
            success: function(data) {
                addLoadedItems(data);
            }
        })
    }

    //iterates through every product and adds it to the page
    function addLoadedItems(items) {
        var i = 0;
        for (i; i < items.length; i++) {
            addProduct(items[i].description, items[i].cost, items[i].quantity);
        }
    }

    //displays the product on the page
    function addProduct(description, price, quantity) {
        //gets the value of the characters in the search box
        let search = $('#search').val();

        //if products description does not start with the value in the seach box, does
        //not add product to the page
        if (!description.startsWith(search)) {
            return;
        }

        //HTML for the product to be added
        var productHTML = '<div class="box wow fadeInLeft">';
        productHTML += '<h3 id = "productDescription"></h3>';
        productHTML += '<h4 id = "productPrice"></h4>';
        productHTML += '<button id = "addToCart" type="button" class="btn" >Add to Cart</button>';
        productHTML += '<input id = "quantity" type="number" value="1" name="quantity" min="0" max ="99" onkeydown="return false">';
        productHTML += '</div>';

        //fills in html values of the particular product
        var $newTask = $(productHTML);
        $newTask.find('#ProductDescription').text(description);
        $newTask.find('#productPrice').text('$' + price);
        //adds product to the screen
        $('#productList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);
    }

    // Button for adding prodcuts to a users cart
    $('#productList').on('click', '.btn', function() {
        // gets description and quantity of item from the html
        let description = $(this).prev().prev().text();
        let quantity = $(this).next().val();
        //posts data to the server
        $.ajax({
            method: 'POST',
            url: URL + '/cart',
            data: JSON.stringify({
                description: description,
                quantity: quantity
            }),
            contentType: "application/json",
            //if 401 they are not logged in and will be prompted to do so.
            statusCode: {
                401: function() {
                    $('#noAuth').dialog('open');
                }
            }
        });
    });


    /* Cart
    --------------------------------*/
    //search input for the cart section
    //re-loads the list every time a new character is inputted
    $('#cartSearch').on('input', function() {
        loadCartList();
    });


    // loads a users cart from the server
    function loadCartList() {
        //emptys the section
        $("#cartList").empty();
        $.ajax({
            method: 'GET',
            url: URL + '/cart',
            success: function(data) {
                addCartItems(data);
            },
            statusCode: {
                // error 401 no authorisation, opens login dialog and hides the cart section
                401: function() {
                    $('#noAuth').dialog('open');
                    $("#cart").hide();
                    $("#purchases").hide();
                    $("#products").show();
                }
            }


        });
    }

    //adds the users cart items to the page.
    function addCartItems(items) {
        //if the user has no items in their cart it displays this
        if (items.length == 0) {
            var cartHTML = '<div class="box wow fadeInLeft">';
            cartHTML += '<h3 id = "productDescription">There is nothing in your cart</h3>';
            cartHTML += '</div>';
            var $newTask = $(cartHTML);
            $('#cartList').prepend($newTask);
            $newTask.show('clip', 250).effect('highlight', 1000);
        } else {
            //else adds all the items to the page, as well as a total and a purchase button
            addTotal(items);
            var i = 0;
            for (i; i < items.length; i++) {
                addCart(items[i].description, items[i].cost, items[i].quantity, items[i].id);
            }
        }
    }


    function addCart(description, price, quantity, id) {
        //see if the cart item begins with the search string
        let search = $('#cartSearch').val();

        if (!description.startsWith(search)) {
            return;
        }

        //HTML for the cart item to be added
        var cartHTML = '<div class="box wow fadeInLeft">';
        cartHTML += '<h3 id = "cartDescription"></h3>';
        cartHTML += '<h4 id = "cartPrice"></h4>';
        cartHTML += '<h3 id = "cartQuantity"></h3>';
        cartHTML += '<h6 id = "cartId"></h6>';
        cartHTML += '<button type="button" class="removeBtn" >Remove from cart</button>';
        cartHTML += '</div>';

        //fills in html values of the particular cart item
        var $newTask = $(cartHTML);
        $newTask.find('#cartDescription').text(description);
        $newTask.find('#cartPrice').text('$' + price);
        $newTask.find('#cartQuantity').text('Quantity:' + quantity);
        $newTask.find('#cartID').text(id);
        //adds it the the page
        $('#cartList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);
    }

    //adds a box with the total of all items in the cart and a purchase button
    function addTotal(items) {
        let total = 0;
        let i = 0;
        for (i; i < items.length; i++) {
            total = total + (items[i].cost * items[i].quantity);
        }
        var cartHTML = '<div class="box wow fadeInLeft">';
        cartHTML += '<h3 id = "total"></h3>';
        cartHTML += '<button type="button" class="purchaseBtn" >Purchase Items</button>';
        cartHTML += '</div>';


        var $newTask = $(cartHTML);
        $newTask.find('#total').text("Total: $" + total);
        $('#cartList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);

    }

    //remove from cart button. deletes the item
    $('#cart').on('click', '.removeBtn', function() {
        //this is the unique id for the cart item to be deleted.ajax
        // it is in the html however is hidden from the page as it is not
        // neccesarry information
        let id = $(this).prev().text();
        $.ajax({
            method: 'DELETE',
            url: URL + '/cart',
            data: JSON.stringify({
                id: id
            }),
            contentType: "application/json",
            //if request was succesfull we add it to the screen
            success: function(d) {
                loadCartList();
            }
        });
    });


    //adds items from cart when user clicks on purchase button in the cart section
    $('#cart').on('click', '.purchaseBtn', function() {
        $.ajax({
            method: 'GET',
            url: URL + '/cart',
            //if logged in will purchase every item in their cart
            success: function(items) {
                //gets all cart ids of items in their cart
                let itemIds = [];
                let i = 0;
                for (i; i < items.length; i++) {
                    itemIds.push(items[i].id);
                }
                //sends cartIds that are to be moved from cart to purchases to the server
                $.ajax({
                    method: 'POST',
                    url: URL + '/purchases',
                    data: JSON.stringify({
                        cartIDs: itemIds,
                    }),
                    contentType: "application/json",
                    success: function(d) {
                        //reloads the cart list (should now be empty)
                        loadCartList();
                    }
                });
            },
            // user is not logged in so cannot do so, this show not actually be possible as they should never be able to get
            // the purchases button without logging in, however is there as a precaution
            statusCode: {
                401: function() {
                    $('#noAuth').dialog('open');
                }
            }
        });
    });


    /* purchases
    --------------------------------*/
    //search input for the order history section
    //re-loads the list every time a new character is inputted
    $('#purchaseSearch').on('input', function() {
        loadPurchaseList();
    });

    //loads all purchases made by a user from the server
    function loadPurchaseList() {
        //emptys the list
        $("#purchasesList").empty();
        $.ajax({
            method: 'GET',
            url: URL + '/purchases',
            //adds all purchases to the screen
            success: function(data) {
                addPurchasedItems(data);
            },
            //if the user is not logged it it opens the login prompt and takes
            //the user back to the product section
            statusCode: {
                401: function() {
                    $('#noAuth').dialog('open');
                    $("#cart").hide();
                    $("#purchases").hide();
                    $("#products").show();
                }
            }
        });
    }

    //adds purchased items to the page
    function addPurchasedItems(items) {
        //if use has no purchased items it displays that
        if (items.length == 0) {
            var purchaseHTML = '<div class="box wow fadeInLeft">';
            purchaseHTML += '<h3 id = "productDescription">You have not bought anything</h3>';
            purchaseHTML += '</div>';
            var $newTask = $(purchaseHTML);
            $('#purchasesList').prepend($newTask);
            $newTask.show('clip', 250).effect('highlight', 1000);
        }
        //else adds purchased items to the page
        else {
            var i = 0;
            for (i; i < items.length; i++) {
                addPurchase(items[i].description, items[i].cost, items[i].quantity, items[i].date);
            }
        }
    }

    //adds HTML for a purchase
    function addPurchase(description, price, quantity, date) {
        //checks if the purchase item to be added starts with the search string
        let search = $('#purchaseSearch').val();
        if (!description.startsWith(search)) {
            return;
        }

        // HTML for each purchase item
        var purchaseHTML = '<div class="box wow fadeInLeft">';
        purchaseHTML += '<h3 id = "purchaseDescription"></h3>';
        purchaseHTML += '<h3 id = "purchasePrice"></h3>';
        purchaseHTML += '<h3 id = "purchaseQuantity"></h3>';
        purchaseHTML += '<h3 id = "purchaseDate"></h3>';
        purchaseHTML += '</div>';

        //values of the purchase to be added.
        date = date.split('T')[0];
        var $newTask = $(purchaseHTML);
        $newTask.find('#purchaseDescription').text(description);
        $newTask.find('#purchasePrice').text("Cost: $" + price);
        $newTask.find('#purchaseQuantity').text("Quantity: " + quantity);
        $newTask.find('#purchaseDate').text("Date: " + date);
        $('#purchasesList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);
    }


    /* Admin Nav
    --------------------------------*/

    // same sort of format as the user nav button
    // same section hiding used

    $('#addProductsBtn').on('click', function() {
        $("#addProducts").show();
        $("#deleteProducts").hide();
        $("#editOrders").hide();
    });

    $('#deleteProductsBtn').on('click', function() {
        $("#addProducts").hide();
        $("#deleteProducts").show();
        $("#editOrders").hide();
        loadDeleteItems();
    });

    $('#editOrdersBtn').on('click', function() {
        $("#addProducts").hide();
        $("#deleteProducts").hide();
        $("#editOrders").show();
    });

    $('#adminlogout').on('click', function() {
        $.ajax({
            method: 'POST',
            url: URL + '/logout',
            success: function(data) {
                $('#login').html('Login');
                $("#adminnav").hide();
                $("#purchases").hide();
                $("#cart").hide();
                $("#admin").hide();

                $("#usernav").show();
                $("#products").show();
                loadList();
            }
        });
    });

    //Adds a new product to the product list
    $('#addProductBtn').on('click', function() {
        //get description and price from the html input boxes
        let description = $("#addProductDescription").val();
        let price = $("#addProductPrice").val();

        $.ajax({
            method: 'POST',
            url: URL + '/products',
            data: JSON.stringify({
                description: description,
                cost: price
            }),
            contentType: "application/json",
            //displays if product was added, and resets the boxs
            success: function(d) {
                $("#addProductStatus").html('Product Added!');
                $("#addProductDescription").val('');
                $("#addProductPrice").val('');
            },
            //displays if the product alread exists
            statusCode: {
                409: function() {
                    $("#addProductStatus").html('Product Already Exists');
                    $("#addProductDescription").val('');
                    $("#addProductPrice").val('');
                }
            }
        });
    });

    // loads all products from the server and displays them
    function loadDeleteItems() {
        $("#deleteList").empty();
        $.ajax({
            method: 'GET',
            url: URL + '/products',
            success: function(items) {
                addDeleteItems(items)
            },
        });
    }

    //adds all products to the page
    function addDeleteItems(items) {
        var i = 0;
        for (i; i < items.length; i++) {
            addDelete(items[i].description, items[i].cost);
        }
    }

    //HTML for all products, includes a delete button which will delete the product from the server
    function addDelete(description, price) {
        var productHTML = '<div class="box wow fadeInLeft">';
        productHTML += '<h3 id = "deleteDescription"></h3>';
        productHTML += '<h4 id = "deletePrice"></h4>';
        productHTML += '<button id = "deleteButton" type="button" class="deleteBtn" >Delete</button>';
        productHTML += '</div>';

        var $newTask = $(productHTML);
        $newTask.find('#deleteDescription').text(description);
        $newTask.find('#deletePrice').text('$' + price);
        $('#deleteList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);
    }

    //delete button, removed the associated product from the server
    $('#deleteProducts').on('click', '.deleteBtn', function() {
        let description = $(this).prev().prev().text();
        $.ajax({
            method: 'DELETE',
            url: URL + '/products',
            data: JSON.stringify({
                description: description
            }),
            contentType: "application/json",
            //if request was succesfull we reload the products as one will be removed
            success: function(d) {
                loadDeleteItems();
            }
        });
    });


    // button to load a users orders from the server
    $('#getCustomerPurchaseBtn').on('click', function() {
        // user name to get order for
        let email = $('#customerSearch').val();
        loadCustomerPurchaseList(email);
    });

    // loads a particular users orders from the server
    function loadCustomerPurchaseList(email) {
        $("#customerOrderList").empty();
        $.ajax({
            method: 'GET',
            url: URL + '/purchases',
            data: {
                "email": email
            },
            //adds their orders to the page
            success: function(data) {
                addCustomerPurchases(data);
            }
        });
    }


    function addCustomerPurchases(items) {
        //if user has not orders it displays this
        if (items.length == 0) {
            var purchaseHTML = '<div class="box wow fadeInLeft">';
            purchaseHTML += '<h3 id = "productDescription">Customer has not bought anything</h3>';
            purchaseHTML += '</div>';
            var $newTask = $(purchaseHTML);
            $('#purchasesList').prepend($newTask);
            $newTask.show('clip', 250).effect('highlight', 1000);
        }
        //else adds all the purchases they have made to the page
        else {
            var i = 0;
            for (i; i < items.length; i++) {
                addCustomerPurchase(items[i].description, items[i].cost, items[i].quantity, items[i].date, items[i].id);
            }
        }
    }

    //HTML for a users purchaseSearch
    // includes a button to delete the order, or archive the order
    function addCustomerPurchase(description, price, quantity, date, id) {

        var purchaseHTML = '<div class="box wow fadeInLeft">';
        purchaseHTML += '<h3 id = "deleteDescription"></h3>';
        purchaseHTML += '<h3 id = "deletePrice"></h3>';
        purchaseHTML += '<h3 id = "deleteQuantity"></h3>';
        purchaseHTML += '<h3 id = "deleteId"></h3>';
        purchaseHTML += '<h3 id = "deleteDate"></h3>';
        purchaseHTML += '<button id = "deletePurchaseBtn" type="button" class="deletePurchaseBtn" >Delete</button>';
        purchaseHTML += '<button id = "archivePurchaseBtn" type="button" class="archivePurchaseBtn" >Archive</button>';
        purchaseHTML += '</div>';

        //data to be added to  the html
        date = date.split('T')[0];
        var $newTask = $(purchaseHTML);
        $newTask.find('#deleteDescription').text(description);
        $newTask.find('#deletePrice').text("Cost: $" + price);
        $newTask.find('#deleteQuantity').text("Quantity: " + quantity);
        $newTask.find('#deleteId').text("ID: " + id);
        $newTask.find('#deleteDate').text("Date: " + date);

        //adds it to the page
        $('#customerOrderList').prepend($newTask);
        $newTask.show('clip', 250).effect('highlight', 1000);
    }

    //delete a order from the database
    $('#editOrders').on('click', '.deletePurchaseBtn', function() {
        //gets the purchase id from the html
        let id = $(this).prev().prev().text().split(":")[1];
        $.ajax({
            method: 'DELETE',
            url: URL + '/purchases',
            data: JSON.stringify({
                id: id
            }),
            contentType: "application/json",
            //if request was succesfull reload order history as one has been deleted
            success: function(d) {
                let email = $('#customerSearch').val();
                loadCustomerPurchaseList(email);
            }
        });
    });

    // archive an order from the database
    $('#editOrders').on('click', '.archivePurchaseBtn', function() {
        let id = $(this).prev().prev().prev().text().split(":")[1];
        $.ajax({
            method: 'DELETE',
            url: URL + '/archive',
            data: JSON.stringify({
                id: id
            }),
            contentType: "application/json",
            //if request was succesfull reload order history as one has been archived
            success: function(d) {
                let email = $('#customerSearch').val();
                loadCustomerPurchaseList(email);
            }
        });
    });



    /* Authorisation
    --------------------------------*/
    // popup to request authenication
    $('#noAuth').dialog({
        modal: true,
        autoOpen: false,
        buttons: {
            "Yes": function() {
                window.location.href = URL + "/login";
            },
            "No": function() {
                $(this).dialog('close');
            }
        }
    });


}); // end ready
