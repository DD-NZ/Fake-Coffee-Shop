#register user Dan
curl -i -X POST -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' https://nwen-project.herokuapp.com/users

#Login - Authenticate user
curl -i -X GET -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09c"}' https://nwen-project.herokuapp.com/authenticateUser

#Change Password
curl -i -X PUT -H "Content-Type: application/json" -d '{"email":"dan","password":"fa8f14e9d1d6cd28b83f9b177abce09b"}' https://nwen-project.herokuapp.com/changePassword

# adds 20 coffee to cart - requires a cookie for authentication
curl -w "@curl-format.txt" -o /dev/null -s 'https://nwen-project.herokuapp.com/cart/?[1-20]' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' -H 'Origin: https://nwen-project.herokuapp.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.9' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' -H 'Content-Type: application/json' -H 'Accept: */*' -H 'Referer: https://nwen-project.herokuapp.com/' -H 'X-Requested-With: XMLHttpRequest' -H 'Cookie: connect.sid=s%3AIAkKnh1kLvGSLKG75e04Yf9Nktw3K0z3.uaP3JCFRWMSPeh9Qp0gJ8yfOCoPkKFm0FWru%2FsUlEJw' -H 'Connection: keep-alive' --data-binary '{"description":"Coffee","quantity":"3"}' --compressed

# purchases items from a users cart - requires cookie for authenication
curl -i 'https://nwen-project.herokuapp.com/purchases' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' -H 'Origin: https://nwen-project.herokuapp.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.9' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' -H 'Content-Type: application/json' -H 'Accept: */*' -H 'Referer: https://nwen-project.herokuapp.com/' -H 'X-Requested-With: XMLHttpRequest' -H 'Cookie: connect.sid=s%3AkgIVl8EQEGtKOQOwhyZQK3OsMKCGi1zB.vCz0O6d%2BYntvHM5qVO7ShYAwD3UBLNwiUy3XblP79mE' -H 'Connection: keep-alive' --data-binary '{"cartIDs":[[1-5]]]}' --compressed

# getProducts
curl -w "@curl-format.txt" -o /dev/null -s 'https://nwen-project.herokuapp.com/products/?[1-1]' -H 'Accept: */*' -H 'Referer: https://nwen-project.herokuapp.com/' -H 'X-Requested-With: XMLHttpRequest' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' -H 'Sec-Fetch-Mode: cors' --compressed
