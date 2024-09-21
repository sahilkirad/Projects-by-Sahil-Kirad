const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton= document.querySelector("#delete-chat-button");
let userMessage = null;
let isResponseGenerating = false;   
// API CONFIGURATION
const API_KEY = "AIzaSyBwBNhye49oII8JEpcvkTkWbmtUwkmFIPM";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;


//getting local storage theme color value
const  loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText= isLightMode ? "dark_mode" : "light_mode";
    //restore the saved chats
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);  //scroll to bottom

}   
loadLocalStorageData();
//Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML=content;
    return div;

}

// typing effect
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        //append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++]; 
        incomingMessageDiv. querySelector(".icon").classList.add("hide");
        // if all words are displayed
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            //hiding copy icon while response is being typed
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            // saving chats to local storage and restore them as the page refresh
            localStorage.setItem("savedChats", chatList.innerHTML) // save chats to local storage once response typing effect is completed
               
        }
        chatList.scrollTo(0, chatList.scrollHeight);  //scroll to bottom
    }, 75);
}

// FETCH RESPONSE FROM THE API BASED ON USER MESSAGE
const genearateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");  // get text element
    // SEND A POST REQUEST TO THE API WITH THE USER'S MESSAGE
    try 
    {
        const response = await fetch(API_URL, 
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body : JSON.stringify({
            contents : [{
                role: "user",
                parts: [{ text: userMessage}]
            }]
        })
    });
    const data= await response.json();
    if(! response.ok) throw new Error(data.error.message);
    //Get the api response and remove asterisks from it
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    }  catch (error)
    {
        isResponseGenerating= false;
       textElement.innerText = error.message;
       textElement.classList.add("error");

    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}


//SHOW A LOADING ANIMATION WHILE WAITING FOR THE API RESPONSE
const showLoadingAnimation = () => {
    const html= `<div class="message-content">
                <img src="https://miro.medium.com/v2/resize:fit:612/1*C_LFPy6TagD1SEN5SwmVRQ.jpeg" alt="robot" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
            const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
            chatList.appendChild(incomingMessageDiv);
            chatList.scrollTo(0, chatList.scrollHeight);  //scroll to bottom
            
            // Add mouse event listeners to keep the content visible on hover
            // incomingMessageDiv.addEventListener("mouseenter", () => {
            //     incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            // });
            
            // incomingMessageDiv.addEventListener("mouseleave", () => {
            //     incomingMessageDiv.querySelector(".icon").classList.add("hide");
            // });
            
            genearateAPIResponse(incomingMessageDiv);
            


}

//Copy message text to the clipboard
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";   // show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy" ,1000 ) //revert icon after 1 sec
}
//HANDLE SENDING OUTGOING CHAT MESSAGES
const handleOutgoingChat = () => {
    userMessage =  typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; //exit if there is no message

    isResponseGenerating = true;
    const html= `<div class="message-content">
                <img src="https://i.pinimg.com/736x/f3/74/6b/f3746bf82c02295b1824301a9159c38e.jpg" alt="krishna" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();// CLEAR INPUT FIELD
    chatList.scrollTo(0, chatList.scrollHeight);  //scroll to bottom
    document.body.classList.add("hide-header");  //hide the header once the chat starts
    setTimeout(showLoadingAnimation, 500);  //SHOW LOADING ANIMATION AFTER A DELAY
}

//set username and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();

    });
    
});

// TOGGLE BETWEEN LIGHT AND DARK THEME
toggleThemeButton.addEventListener("click" , () => {
   const isLightMode = document.body.classList.toggle("light_mode");
      //saving selected theme on the browser, local storage and restore it on page refresh 
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")

    toggleThemeButton.innerText= isLightMode ? "dark_mode" : "light_mode";
});

//delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
});
//PREVENT DEFAULT FORM SUBMISSION AND HANDLE OUTGOING CHAT
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});