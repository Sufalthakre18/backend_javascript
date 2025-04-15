use ("aggregate")

// db.books.insertOne(
//     {
//         "_id": 5,
//         "title": "A Tale of Two Cities",
//         "author_id": 400,
//         "genre": "Historical Fiction"
//     }
// )


let a=db.books.find({ "title": "A Tale of Two Cities" })
console.log(a);


db.books.updateOne({ "title": "A Tale of Two Cities" },{
    $set: { "author_id": 500 }
})

