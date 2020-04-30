#add user Dan
curl -i -X POST -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' https://nwen-project.herokuapp.com/users

#Authenticate user
curl -i -X GET "https://nwen-project.herokuapp.com/authenticateUser?email=dan&password=fa8f14e9d1d6cd28b83f9b177abce09c"


#Change Password
curl -i -X PUT -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09b"}' https://nwen-project.herokuapp.com/changePassword

#Check if user is currently authenticated
curl -i -X GET "https://nwen-project.herokuapp.com/authenication"

curl -X GET -H "Content-Type: application/json" https://nwen-project.herokuapp.com/users

curl -i -X GET -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' https://nwen-project.herokuapp.com/authenticateUser

curl -i -X POST -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' http://localhost:8080/users

curl -X GET  http://localhost:8080/users

curl -i -X GET -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' http://localhost:8080/authenticateUser


curl http://localhost:8080 --include
