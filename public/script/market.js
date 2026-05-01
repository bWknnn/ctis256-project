document.querySelector(".options").addEventListener("click", ()=>{
    let container = document.querySelector(".left")
    container.classList.toggle("visible")    
    let main = document.querySelector(".main");
    main.classList.toggle("shift");
})