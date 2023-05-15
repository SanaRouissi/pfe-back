const prisma = require("../../prisma");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const generateToken = async({user})=>{
  const token = jwt.sign(user, process.env.JWT_SECRET);
  await prisma.token.create({
    data: {
      value: token,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });
  return token
}

const login = async ({ trigramme, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      trigramme,
    },
    select: {
      id: true,
      nom: true,
      password: true,
      prenom: true,
      trigramme: true,
      image: true,
      equipe: true,
      isAdmin: true,
    },
  });
  const bcryptResult = await bcrypt.compare(password, user.password);
  if (!bcryptResult) throw new Error();
  delete user.password;
  return { token: await generateToken({user}) };
};
module.exports = { generateToken, login }
