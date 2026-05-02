const inputs = document.querySelectorAll("input");

inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/, "");
    
    if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }
    });

    input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
    }
    });

    input.addEventListener("paste", (e)=>{
        e.preventDefault()
        const paste = e.clipboardData.getData("text")

        for(let i = 0;i<inputs.length;i++){
            inputs[i].value = paste[i]
        }
       
        inputs[inputs.length - 1].focus();
    })
});