var selectedRow = null;
let db;

// Initialize IndexedDB
window.onload = () => {
    let request = indexedDB.open("CommentsDB", 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore("comments", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("firstName", "firstName", { unique: false });
        objectStore.createIndex("lastName", "lastName", { unique: false });
        objectStore.createIndex("comment", "comment", { unique: false });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadComments();
    };

    request.onerror = (event) => {
        console.error("Error opening IndexedDB:", event.target.errorCode);
    };
};

// Show alerts
function showAlert(message, className) {
    const div = document.createElement("div");
    div.className = `alert alert-${className}`;
    div.appendChild(document.createTextNode(message));
    const container = document.querySelector(".container");
    const main = document.querySelector(".main");
    container.insertBefore(div, main);

    setTimeout(() => document.querySelector(".alert").remove(), 3000);
}

// Clear all fields
function clearFields() {
    document.querySelector("#firstname").value = "";
    document.querySelector("#lastname").value = "";
    document.querySelector("#comment").value = "";
}

// Add comment to IndexedDB and DOM
document.querySelector("#user-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const firstName = document.querySelector("#firstname").value;
    const lastName = document.querySelector("#lastname").value;
    const comment = document.querySelector("#comment").value;

    if (firstName === "" || lastName === "" || comment === "") {
        showAlert("Please fill in all fields", "danger");
    } else {
        if (selectedRow == null) {
            addComment({ firstName, lastName, comment });
            showAlert("Comment Added", "success");
        } else {
            updateCommentInDB({ id: parseInt(selectedRow.dataset.id), firstName, lastName, comment });
            selectedRow = null;
            showAlert("Comment Updated", "info");
        }

        clearFields();
    }
});

// Load all comments from IndexedDB
function loadComments() {
    const transaction = db.transaction("comments", "readonly");
    const objectStore = transaction.objectStore("comments");

    objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            addCommentToDOM(cursor.value);
            cursor.continue();
        }
    };
}

// Add a new comment to IndexedDB
function addComment(commentData) {
    const transaction = db.transaction("comments", "readwrite");
    const objectStore = transaction.objectStore("comments");
    const request = objectStore.add(commentData);

    request.onsuccess = () => addCommentToDOM({ ...commentData, id: request.result });
    transaction.onerror = () => showAlert("Error saving comment", "danger");
}

// Add a comment to the DOM
function addCommentToDOM(commentData) {
    const list = document.querySelector("#Comment-list");
    const row = document.createElement("tr");

    row.setAttribute("data-id", commentData.id);
    row.innerHTML = `
        <td>${commentData.firstName}</td>
        <td>${commentData.lastName}</td>
        <td>${commentData.comment}</td>
        <td>
            <a href="#" class="btn btn-warning btn-sm edit">Edit</a>
            <a href="#" class="btn btn-danger btn-sm delete">Delete</a>
        </td>
    `;

    list.appendChild(row);
}

// Edit comment in IndexedDB and DOM
document.querySelector("#Comment-list").addEventListener("click", (e) => {
    if (e.target.classList.contains("edit")) {
        selectedRow = e.target.parentElement.parentElement;
        const commentId = parseInt(selectedRow.dataset.id);

        const transaction = db.transaction("comments", "readonly");
        const objectStore = transaction.objectStore("comments");
        const request = objectStore.get(commentId);

        request.onsuccess = () => {
            const commentData = request.result;
            document.querySelector("#firstname").value = commentData.firstName;
            document.querySelector("#lastname").value = commentData.lastName;
            document.querySelector("#comment").value = commentData.comment;
        };
    }
});

// Update comment in IndexedDB
function updateCommentInDB(commentData) {
    const transaction = db.transaction("comments", "readwrite");
    const objectStore = transaction.objectStore("comments");
    const request = objectStore.put(commentData);

    request.onsuccess = () => {
        selectedRow.children[0].textContent = commentData.firstName;
        selectedRow.children[1].textContent = commentData.lastName;
        selectedRow.children[2].textContent = commentData.comment;
    };
}

// Delete comment from IndexedDB and DOM
document.querySelector("#Comment-list").addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
        const row = e.target.parentElement.parentElement;
        const commentId = parseInt(row.dataset.id);

        const transaction = db.transaction("comments", "readwrite");
        const objectStore = transaction.objectStore("comments");
        objectStore.delete(commentId).onsuccess = () => {
            row.remove();
            showAlert("Comment Deleted", "danger");
        };
    }
});
