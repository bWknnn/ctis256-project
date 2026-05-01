document.querySelectorAll(".change").forEach(b =>{
    b.addEventListener("click", ()=>{
        document.querySelectorAll(".edit").forEach(e=>{
            e.classList.toggle("visible")
        })
    })
})