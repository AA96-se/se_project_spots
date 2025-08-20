import "./index.css";
import { enableValidation, settings } from "../scripts/validation.js";
import Api from "../utils/Api.js";

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

const avatarBtn = document.querySelector(".profile__avatar-edit-button"); // ADDED
const avatarModal = document.querySelector("#avatar-modal"); // ADDED
const avatarFormEl = avatarModal.querySelector(".modal__form"); // ADDED

const newPostBtn = document.querySelector(".profile__add-button");
const newPostModal = document.querySelector("#new-post-modal");
const newPostFormEl = newPostModal.querySelector(".modal__form");

const deleteConfirmModal = document.querySelector("#delete-confirm-modal"); // ADDED
const deleteConfirmBtn = deleteConfirmModal.querySelector(
  ".modal__confirm-btn"
); // ADDED

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
    btn.textContent = formEl.dataset.initialText;
    btn.disabled = false;
  }
}

function getCardElement(data) {
  const cardElement = cardTemplate.cloneNode(true);
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__delete-button");
  const img = cardElement.querySelector(".card__image");
  const title = cardElement.querySelector(".card__title");

  img.src = data.link;
  img.alt = data.name;
  title.textContent = data.name;
  cardElement.dataset.id = data._id;

  likeButton.addEventListener("click", () => {
    const action = likeButton.classList.contains("card__like-button_active")
      ? api.unlikeCard(data._id)
      : api.likeCard(data._id);

    action
      .then(() => likeButton.classList.toggle("card__like-button_active"))
      .catch(console.error);
  });

  deleteButton.addEventListener("click", () => {
    openModal(deleteConfirmModal);
    deleteConfirmBtn.onclick = () => {
      api
        .deleteCard(data._id)
        .then(() => {
          cardElement.remove();
          closeModal(deleteConfirmModal);
        })
        .catch(console.error);
    };
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
avatarBtn.addEventListener("click", () => openModal(avatarModal)); // ADDED

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
    })
    .catch(console.error)
    .finally(() => handleSubmitButton(newPostFormEl, false));
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (evt.target.classList.contains("modal")) closeModal(modal);
  });
});

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
