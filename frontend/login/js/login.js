$(document).ready(function(e) {
    const URL = "https://nwen-project.herokuapp.com";
    //const URL = "http://localhost:8080";

    //hides the password rest option
    $("#resetPassword").hide();


    //Login button
    $("#loginBtn").click(function(event) {
        //takes the users username and password and hashses it
        var email = $("#username").val();
        var password = $("#password").val();

        //I realise now this is unnessesary as server side hashing is only needed
        //however i added it and kept it for extra security.
        var passwordHash = CryptoJS.MD5(password).toString();
        //authenticates users input
        $.ajax({
            method: "GET",
            url: URL + "/user",
            data: {
                email: email,
                password: passwordHash
            },
            contentType: "application/json",
            //login success navigate back to the home page
            success: function(d) {
                window.location.replace(URL);
            },
            //invalid email or password displays it to user
            statusCode: {
                400: function() {
                    $('#errorMessage').text("Invalid email or password");
                }
            }
        });
    });


    //reset password form
    $('#Form').on('submit', function(event) {
        //form validation rules below
        if ($('#Form').valid()) {
            event.preventDefault();
            var name = $('#resetname').val();
            var password = $('#resetpassword').val();
            var passwordHash = CryptoJS.MD5(password).toString();

            //updates users username and password
            $.ajax({
                method: 'PUT',
                url: URL + '/changePassword',
                data: JSON.stringify({
                    email: name,
                    password: passwordHash
                }),
                contentType: "application/json",
                //if request was succesfull we show the login page agin
                success: function(d) {
                    $("#login").show();
                    $("#resetPassword").hide();
                },
                //if there is no such email to changePassword for, we show it
                statusCode: {
                    404: function() {
                        $('#resetErrorMessage').text("Invalid email");
                    }
                }
            });
        }
    });

    $("#Form").validate({
        rules: {
            resetname: {
                required: true
            },
            resetpassword: {
                required: true,
                pwcheck: true,
                minlength: 5
            },
            resetconfirm: {
                equalTo: '#resetpassword'
            }
        },
        messages: {
            resetname: {
                required: "Please enter your name."
            },
            resetpassword: {
                required: "Please enter your password.",
                min: "Password must be at least 5 characters.",
                pwcheck: "Password must have a capital letter and a number"
            },
            resetconfirm: {
                equalTo: "Passwords must match."
            }
        }
    });

    //validates there is a capital letter and a number
    $.validator.addMethod("pwcheck",
        function(value, element) {
            return /^[A-Za-z0-9\d=!\-@._*]+$/.test(value) &&
                /[A-Z]/.test(value) // has a lowercase letter
                &&
                /\d/.test(value); // has a digit
        });

    $("#registerButton").click(function(event) {
        window.location.href = URL + "/register";
    });

    $("#backToHome").click(function(event) {
        window.location.href = URL;
    });

    $("#changePassword").click(function(event) {
        $("#login").hide();
        $("#resetPassword").show();
    });

    $("#back").click(function(event) {
        $("#login").show();
        $("#resetPassword").hide();
    });

}); // end ready
