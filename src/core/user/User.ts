// export default class User {
//   id: number;
//   username: string;
//   password: string;

//   constructor(id: number, username: string, password: string) {
//     this.id = id;
//     this.username = username;
//     this.password = password;
//   }
// }

export default class User {
  // Yukarıda alan tanımlamaya gerek yok, içeride atama yapmaya gerek yok!
  constructor(
    public id: number,
    public username: string,
    public password: string,
  ) {}
}
