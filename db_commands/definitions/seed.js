const prisma = require("../../prisma");
const { faker } = require("@faker-js/faker");

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomValuesFromArr(arr, n) {
  const shuffled = (Array.isArray(arr) ? arr : []).sort(
    () => 0.5 - Math.random()
  );
  return shuffled.slice(0, n);
}

function generateArrLength(len) {
  return Array.from(Array(len).keys()).map((e) => e + 1);
}

const VALUES = {
  equipe: {
    total: 7,
    placeholders: [
      (i) => ["CST", "R&D", "TDC", "QA", "OPS", "RH", "DIRECTION"][i],
    ],
    args: (p1, i) => ({
      nom: p1(i),
    }),
  },
  user: {
    total: 150,
    placeholders: [
      () => faker.name.firstName(),
      () => faker.name.lastName(),
      () => process.env.INIT_SEED_PASS,
      () => (faker.internet.userName() + "_" + makeid(15)).toLowerCase(),
      () => faker.datatype.datetime(1546297200000, 1672441200000),
      () => faker.image.avatar(),
      () => randomIntFromInterval(1, 7),
    ],
    args: (p1, p2, p3, p4, p5, p6, p7) => ({
      nom: p1(),
      prenom: p2(),
      password: p3(),
      trigramme: p4(),
      created_at: p5(),
      image: {
        create: {
          path: p6(),
        },
      },
      equipe: {
        connect: {
          id: p7(),
        },
      },
    }),
  },
  categorie: {
    total: 60,
    placeholders: [() => faker.commerce.productAdjective() + " " + makeid(15)],
    args: (p1) => ({
      nom: p1(),
    }),
  },
  marque: {
    total: 90,
    placeholders: [() => faker.commerce.department() + " " + makeid(15)],
    args: (p1) => ({
      nom: p1(),
    }),
  },
  produit: {
    total: 600,
    placeholders: [
      () =>
        randomValuesFromArr(
          generateArrLength(60),
          randomIntFromInterval(6, 10)
        ).map((e) => ({ id: e })),
      () => randomIntFromInterval(1, 90),
      () => faker.commerce.productName(),
      () => randomIntFromInterval(20, 80),
    ],
    args: (p1, p2, p3, p4) => ({
      categories: {
        connect: p1(),
      },
      marque: {
        connect: {
          id: p2(),
        },
      },
      nom: p3(),
      quantite: p4(),
    }),
  },
  fournisseur: {
    total: 350,
    placeholders: [() => faker.company.name() + " " + makeid(15)],
    args: (p1) => ({
      nom: p1(),
    }),
  },
  facture: {
    total: 1500,
    placeholders: [
      () => randomIntFromInterval(1, 350),
      () => randomIntFromInterval(500, 99999),
      () => (randomIntFromInterval(0, 1) === 0 ? "EN_COURS" : "PAYEE"),
    ],
    args: (p1, p2, p3) => ({
      fournisseur: {
        connect: {
          id: p1(),
        },
      },
      montant: p2(),
      statut: p3(),
    }),
  },
  image: {
    total: 1800,
    placeholders: [
      () => faker.image.image(900, 900),
      () => randomIntFromInterval(1, 600),
    ],
    args: (p1, p2) => ({
      path: p1(),
      produit: {
        connect: {
          id: p2(),
        },
      },
    }),
  },
  demande_restock: {
    total: 2500,
    placeholders: [
      () => randomIntFromInterval(1, 30),
      () => randomIntFromInterval(1, 600),
      () => randomIntFromInterval(1, 150),
      () => faker.datatype.datetime({
        max: new Date("15 April 2023").getTime(),
        min: new Date("18 December 2002").getTime()
      })
    ],
    args: (p1, p2, p3, p4) => ({
      quantite: p1(),
      produit: {
        connect: {
          id: p2(),
        },
      },
      user: {
        connect: {
          id: p3(),
        },
      },
      created_at: p4()
    }),
  },
  // tache: {
  //   total: 3000,
  //   args
  // }
};

const seed_database = async () => {
  try {
    for (const key in VALUES) {
      const total = generateArrLength(VALUES[key].total);
      let counter = 0;
      while (counter < total.length) {
        await prisma[key].create({
          data: VALUES[key].args(...VALUES[key].placeholders, counter),
        });
        counter++;
      }
      console.log(`SEEDED: ${key.toUpperCase()}`);
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = seed_database;
