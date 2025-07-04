// This file is to ensure that the update on the server ONLY happens if an actual change is made.

const form = document.querySelector("#updateForm")
form.addEventListener("change", function () {
    const updateBtn = document.querySelector("button")
    updateBtn.removeAttribute("disabled")
})