$(document).ready(function(e) {
    const URL = "https://nwen-project.herokuapp.com";
    //const URL = "http://localhost:8080";

    //validates form on submition of restration input
    $('#Form').on('submit', function(event) {
        if($('#Form').valid()){
          event.preventDefault();
          var name = $('#name').val();
          var password = $('#password').val();
          var passwordHash = CryptoJS.MD5(password).toString();

          //adds username and password to the database
          $.ajax({
              method: 'POST',
              url: URL + '/user',
              data: JSON.stringify({
                  email: name,
                  password: passwordHash
              }),
              contentType: "application/json",
              //if request was succesfull we redirect to the login page
              success: function(d) {
                  window.location.href = URL+'/login'
              }
          });
        }

    });

    $("#Form").validate({
        rules: {
            name: {
                required: true
            },
            password: {
                required: true,
                pwcheck: true,
                minlength: 5
            },
            confirm: {
                equalTo: '#password'
            }
        },
        messages: {
            name: {
                required: "Please enter your name."
            },
            password: {
                required: "Please enter your password.",
                min: "Password must be at least 5 characters.",
                pwcheck: "Password must have a capital letter and a number"
            },
            confirm: {
                equalTo: "Passwords must match."
            }
        }
    });

    //checks if there is a capital letter and a number
    $.validator.addMethod("pwcheck",
        function(value, element) {
            return /^[A-Za-z0-9\d=!\-@._*]+$/.test(value) &&
                /[A-Z]/.test(value) // has a lowercase letter
                &&
                /\d/.test(value); // has a digit
        });


}); // end ready
