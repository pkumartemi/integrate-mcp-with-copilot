document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const registrationModal = document.getElementById("registration-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalSignupForm = document.getElementById("modal-signup-form");
  const modalEmail = document.getElementById("modal-email");
  const modalActivity = document.getElementById("modal-activity");
  const modalMessage = document.getElementById("modal-message");
  const closeModalBtn = document.querySelector(".close-modal");
  const cancelBtn = document.querySelector(".cancel-btn");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="activity-actions">
            <button class="register-student-btn" data-activity="${name}">Register Student</button>
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-student-btn").forEach((button) => {
        button.addEventListener("click", openRegistrationModal);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Open registration modal
  function openRegistrationModal(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    
    modalTitle.textContent = `Register for ${activity}`;
    modalActivity.value = activity;
    modalEmail.value = "";
    modalMessage.classList.add("hidden");
    registrationModal.classList.remove("hidden");
    modalEmail.focus();
  }

  // Close registration modal
  function closeRegistrationModal() {
    registrationModal.classList.add("hidden");
    modalSignupForm.reset();
    modalMessage.classList.add("hidden");
  }

  // Show message function
  function showMessage(text, type) {
    // Create a temporary message element
    const messageDiv = document.createElement("div");
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Insert after activities container
    const activitiesContainer = document.getElementById("activities-container");
    activitiesContainer.insertAdjacentElement("afterend", messageDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 5000);
  }

  // Handle modal form submission
  modalSignupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = modalEmail.value;
    const activity = modalActivity.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        modalMessage.textContent = result.message;
        modalMessage.className = "success";
        modalMessage.classList.remove("hidden");

        // Close modal after successful registration
        setTimeout(() => {
          closeRegistrationModal();
          showMessage(result.message, "success");
          // Refresh activities list to show updated participants
          fetchActivities();
        }, 1500);
      } else {
        modalMessage.textContent = result.detail || "An error occurred";
        modalMessage.className = "error";
        modalMessage.classList.remove("hidden");
      }
    } catch (error) {
      modalMessage.textContent = "Failed to sign up. Please try again.";
      modalMessage.className = "error";
      modalMessage.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event listeners for modal
  closeModalBtn.addEventListener("click", closeRegistrationModal);
  cancelBtn.addEventListener("click", closeRegistrationModal);
  
  // Close modal when clicking outside
  registrationModal.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !registrationModal.classList.contains("hidden")) {
      closeRegistrationModal();
    }
  });

  // Initialize app
  fetchActivities();
});
