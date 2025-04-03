//password validation
var passwordValidator = require('password-validator');
var passwordValidators = new passwordValidator();
passwordValidators
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
//password validation


const genrateUserAvatar = (username) => {
  return `https://robohash.org/${encodeURIComponent(username)}?set=set1&size=80x80`;
}




module.exports = {
  passwordValidators,
  genrateUserAvatar
} 