const app = require("./app")
//vars
const PORT = process.env.PORT||5000




app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`))