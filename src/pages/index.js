import "./index.css";
import { enableValidation, settings } from "../scripts/validation.js";
import Api from "../../utils/Api.js";

// — Initialize API
const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "351572aa-05fe-4dd3-8aad-64b0748c926d",
    "Content-Type": "application/json",
  },
});

// — DOM Elements
const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarEl = document.querySelector(".profile__avatar");

const editProfileBtn = document.querySelector(".profile__edit-button");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileFormEl = editProfileModal.querySelector(".modal__form");

const avatarBtn = document.querySelector(".profile__avatar-edit-button"); // overlay/edit trigger
const avatarModal = document.querySelector("#avatar-modal");
const avatarFormEl = avatarModal.querySelector(".modal__form");

const newPostBtn = document.querySelector(".profile__add-button");
const newPostModal = document.querySelector("#new-post-modal");
const newPostFormEl = newPostModal.querySelector(".modal__form");

const deleteConfirmModal = document.querySelector("#delete-confirm-modal");
const deleteConfirmBtn = deleteConfirmModal.querySelector(
  ".modal__confirm-btn"
);
const deleteCancelBtn = deleteConfirmModal.querySelector(".modal__close-btn");

const previewModal = document.querySelector("#preview-modal");
const previewImageEl = previewModal.querySelector(".modal__image");
const previewImageCaptionEl = previewModal.querySelector(".modal__caption");

const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardsList = document.querySelector(".cards__list");

// — Helper Functions
function handleSubmitButton(formEl, isLoading, text = "Saving...") {
  const btn = formEl.querySelector(".modal__submit-btn");
  if (isLoading) {
    btn.textContent = text;
    btn.disabled = true;
  } else {
    btn.textContent = formEl.dataset.initialText || "Save";
    btn.disabled = false;
  }
}

function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__delete-button");
  const img = cardElement.querySelector(".card__image");
  const title = cardElement.querySelector(".card__title");
  const likeCountEl = cardElement.querySelector(".card__like-count"); // optional

  img.src = data.link;
  img.alt = data.name;
  title.textContent = data.name;
  cardElement.dataset.id = data._id;

  // Initialize like state from server payload
  if (data.isLiked) {
    likeButton.classList.add("card__like-button_active");
  }
  if (likeCountEl) {
    likeCountEl.textContent = Array.isArray(data.likes) ? data.likes.length : 0;
  }

  likeButton.addEventListener("click", () => {
    const isActive = likeButton.classList.contains("card__like-button_active");
    const action = isActive ? api.unlikeCard(data._id) : api.likeCard(data._id);

    action
      .then((updated) => {
        // Trust server response
        if (updated.isLiked) {
          likeButton.classList.add("card__like-button_active");
        } else {
          likeButton.classList.remove("card__like-button_active");
        }
        if (likeCountEl && Array.isArray(updated.likes)) {
          likeCountEl.textContent = updated.likes.length;
        }
      })
      .catch(console.error);
  });

  deleteButton.addEventListener("click", () => {
    openModal(deleteConfirmModal);
    // Store card ID for confirm handler
    deleteConfirmModal.dataset.cardId = data._id;
    deleteConfirmModal.dataset.cardElementId = data._id;
  });

  img.addEventListener("click", () => {
    openModal(previewModal);
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    previewImageCaptionEl.textContent = data.name;
  });

  return cardElement;
}

// — Modal Functions
function handleEscapeKey(evt) {
  if (evt.key === "Escape") {
    const active = document.querySelector(".modal_is-opened");
    if (active) closeModal(active);
  }
}
function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", handleEscapeKey);
}
function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", handleEscapeKey);
}

// — Event Listeners
editProfileBtn.addEventListener("click", () => openModal(editProfileModal));

if (avatarBtn) {
  // Desktop overlay button (and can be used on mobile too) → open avatar modal
  avatarBtn.addEventListener("click", () => openModal(avatarModal));
}

editProfileFormEl.addEventListener("submit", (evt) => {
  evt.preventDefault();
  handleSubmitButton(editProfileFormEl, true);
  api
    .updateUserInfo({
      name: editProfileFormEl.querySelector("#profile-name-input").value,
      about: editProfileFormEl.querySelector("#profile-description-input")
        .value,
    })
    .then((res) => {
      profileNameEl.textContent = res.name;
      profileDescriptionEl.textContent = res.about;
      closeModal(editProfileModal);
    })
    .catch(console.error)
    .finally(() => handleSubmitButton(editProfileFormEl, false));
});

avatarFormEl.addEventListener("submit", (evt) => {
  evt.preventDefault();
  handleSubmitButton(avatarFormEl, true);
  api
    .updateAvatar(avatarFormEl.querySelector("#avatar-link-input").value)
    .then((res) => {
      profileAvatarEl.src = res.avatar;
      closeModal(avatarModal);
      avatarFormEl.reset();
    })
    .catch(console.error)
    .finally(() => handleSubmitButton(avatarFormEl, false));
});

newPostFormEl.addEventListener("submit", (evt) => {
  evt.preventDefault();
  handleSubmitButton(newPostFormEl, true);
  api
    .addNewCard({
      name: newPostFormEl.querySelector("#card-caption-input").value,
      link: newPostFormEl.querySelector("#card-image-input").value,
    })
    .then((card) => {
      cardsList.prepend(getCardElement(card));
      closeModal(newPostModal);
      newPostFormEl.reset();
    })
    .catch(console.error)
    .finally(() => handleSubmitButton(newPostFormEl, false));
});

newPostBtn.addEventListener("click", () => openModal(newPostModal));

// Delete confirmation modal buttons
deleteConfirmBtn.addEventListener("click", () => {
  const cardId = deleteConfirmModal.dataset.cardId;
  if (!cardId) return;

  api
    .deleteCard(cardId)
    .then(() => {
      // Remove card element from DOM
      const cardToRemove = cardsList.querySelector(`[data-id="${cardId}"]`);
      if (cardToRemove) cardToRemove.remove();

      closeModal(deleteConfirmModal);
    })
    .catch(console.error);
});

deleteCancelBtn.addEventListener("click", () => closeModal(deleteConfirmModal));

// Close modal on click outside modal container
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target.classList.contains("modal")) closeModal(modal);
  });
});

// Close modal on any standard close button
document.querySelectorAll(".modal__close-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = btn.closest(".modal");
    if (modal) closeModal(modal);
  });
});

const previewCloseBtn = previewModal.querySelector(
  ".modal__close-btn_type_preview"
);
if (previewCloseBtn) {
  previewCloseBtn.addEventListener("click", () => closeModal(previewModal));
}

// — Init on Page Load
api
  .getUserInfo()
  .then((data) => {
    profileNameEl.textContent = data.name;
    profileDescriptionEl.textContent = data.about;
    profileAvatarEl.src = data.avatar;
  })
  .catch(console.error);

api
  .getInitialCards()
  .then((cards) => {
    cards.forEach((card) => cardsList.append(getCardElement(card)));
  })
  .catch(console.error);

enableValidation(settings);
