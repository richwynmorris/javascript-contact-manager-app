class Model {
  constructor() {
    this.url = "http://localhost:3000/api/contacts";
    this.contacts;
    this.tags = []
    this.fetchContacts(this.importTagData)
  }

  async fetchContacts(callBack) {
    this.contacts = await (await fetch(this.url)).json()
    callBack(this.contacts)
  }

  addContact(form) {
    let data = this.serialiseForm(form)
    fetch(this.url + '/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    })
  }

  deleteContact(id) {
    fetch(this.url + `/${id}`, {
      method: 'DELETE'
    })
  }

  editContact(form) {
    let data = this.serialiseForm(form)
    let id = form.getAttribute('data-id')

    fetch(this.url + `/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    })
  }

  formatContacts(data) {
    let dataCopy = JSON.parse(JSON.stringify(data))
    dataCopy.map(contact => {
      contact.tags = contact.tags.split(',')
    })
    return dataCopy
  }

  filterContacts(searchValue, byTag) {
    let result;
    if (byTag) {
      result = this.contacts.filter(contact => contact.tags.split(',').includes(searchValue))
    } else {
      result = this.contacts.filter(contact => contact.full_name.slice(0,searchValue.length).toLowerCase() === searchValue.trim().toLowerCase())
    }
    return result
  }

  serialiseForm(form) {
    let tags = []
    let formObj = {};
    let formData = new FormData(form);
    
    for (var key of formData.keys()) {
      if (this.tags.includes(key)) {
        tags.push(key)
      } else {
        formObj[key] = formData.get(key);
      }
    }

    formObj.tags = tags.join(',')
    return formObj;
  }

  importTagData = (data) => {
    data.forEach(contact => {
      contact.tags.split(',').forEach(tag => {
        if (!this.tags.includes(tag) && tag !== '') {
          this.tags.push(tag)
        }
      })
    })
  }
}

class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view
    this.renderContacts()

    this.view.bindClickContactButton(this.handleAddClickContactButton)
    this.view.bindClickCreateTag(this.handleClickCreateTag)
    this.view.bindTagClick(this.handleTagClick)
    this.view.bindTagHover(this.handleTagHover)
    this.view.bindKeyUpSearchBar(this.handleKeyUpSearchBar)
  }

  
  handleAddClickContactButton = (event) => {
    event.preventDefault()
    if (event.target.classList.contains("add-contact-button")) {
      this.generateAddContactForm()
    }
  }

  handleClickCreateTag = event => {
    event.preventDefault()
    this.displayTagForm()
  }


  handleTagClick = event => {
    if (event.target.className === 'tag hover-over') {
      let tagValue = event.target.textContent
      let filteredContacts = this.model.filterContacts(tagValue, true)
      this.displayContacts(filteredContacts)
      this.view.generateBackButton()
      this.addBackButtonEvent()
    }
  }

  handleTagHover = event => {
    if (event.target.className === 'tag') {
      event.target.classList.add('hover-over')
    }
    event.target.onmouseleave = () => {event.target.classList.remove('hover-over')}
  }

  handleKeyUpSearchBar = event => {
    let filteredContacts = this.model.filterContacts(event.target.value)
    this.displayContacts(filteredContacts)
    if (filteredContacts.length !== 0) {
      this.view.generateBackButton()
      this.addBackButtonEvent()
    }
  }

  handleSubmitContactClick = event => {
    event.preventDefault()
    this.submitOrCancelAddContact(event)
  }

  handleEditDeleteButtons = event => {
    event.preventDefault()
    if (event.target.classList.contains('edit-button')) {
      this.displayEditForm(event)
    } else if (event.target.classList.contains('delete-button')) {
      this.deleteContact(event)
    }
  }

  handleEditContactButtons = event => {
    event.preventDefault()
    if (event.target.classList.contains('submit')) {
      this.editContact(event)
    } else if (event.target.classList.contains('cancel')) {
      this.displayHome()
    }
  }

  handleSubmitTag = event => {
    event.preventDefault()
    if (event.target.id === 'submit-tag-button') {
      this.submitTag()
    } else if (event.target.id === 'cancel-tag-button') {
      this.displayHome()
    }
  }

  handleSelectTags = event => {
    event.stopPropagation()
    if (event.target.type !== 'checkbox') return
    event.target.setAttribute('checked', "checked")
  }


  // HELPER METHODS:
  renderContacts() {
    this.model.fetchContacts(this.displayContacts)
  }

  displayContacts = (data) => {
    if (data.length !== 0) {
      let formattedContacts = this.model.formatContacts(data)
      this.generateContacts(formattedContacts)
      this.view.bindEditDeleteButtons(this.handleEditDeleteButtons)
    } else {
      this.view.contactList.innerHTML = ''
      this.displayEmptyContacts()
    }
  }

  displayEmptyContacts() {
    let input = this.view.searchContactBar.value
    if (input !== '') {
      this.view.emptyHeader.textContent = `There are no contacts that start with ${input}`
    } else {
      this.view.emptyHeader.textContent = `There are no contacts`
    }
    this.view.emptyContacts.style.display = 'inline'
  }

  displayForm(form) {
    this.view.formContainer.style.display = "inline"
    this.view.contactBar.style.display = 'none'
    this.view.contactHolder.style.display = 'none'

    if (form === 'tag' ) {
      this.toggleTag()
    } else if (form === 'edit') {
      this.toggleEdit()
    } else if (form === 'add') {
      this.toggleAdd()
    }
  }

  toggleTag() {
    document.getElementById('create-tag-form').style.display = 'inline'
    this.view.formContainer.style.display = 'none'
  }

  toggleEdit() {
    document.getElementById('add-contact').style.display = 'none'
    if (document.getElementById('edit')) {
      document.getElementById('edit').style.display = 'inline'
    }
  }

  toggleAdd() {
    document.getElementById('add-contact').style.display = 'inline'
    document
    if (document.getElementById('edit')) {
      document.getElementById('edit').style.display = 'none'
    }
  }

  displayTagForm() {
    this.view.createTagForm.reset()
    this.displayForm('tag')
    this.view.bindSubmitTag(this.handleSubmitTag)
  }

  displayEditForm(event) {
    if (document.getElementById('edit')) {
      document.getElementById('edit').remove()
    }

    let data = this.getContactData(event)
    this.generateEditForm(data) 
    this.displayForm('edit')
  }

  displayHome() {
    this.view.contactBar.style.display = "grid"
    this.view.contactHolder.style.display = "inline"
    this.view.formContainer.style.display = "none"
    this.view.tagContainer.style.display = "none"
    this.resetSearchBar()
  }

  displayTagCheckBoxes(element) {
    let tagCheckBoxes = Handlebars.compile(document.getElementById("tag-check-template").innerHTML)
    element.innerHTML = tagCheckBoxes({tags: this.model.tags})
  }

  submitOrCancelAddContact(event) {
    if (event.target.classList.contains('submit')) {
      if (!this.checkValidForm()) return
      this.model.addContact(event.currentTarget)
      this.displayHome()
      this.renderContacts(this.model.contacts)
    } else if (event.target.classList.contains('cancel')) {
      this.displayHome()
    }
  }

  submitTag() {
    let tag = this.view.tagInput.value.toLowerCase()
    if (this.model.tags.includes(tag)) {
      alert('Tag already exists. Please use another word for tag.')
      return
    } else if (tag === '') {
      alert('Must enter a valid name for tag.')
      return
    }
    this.model.tags.push(tag)
    this.displayHome()
  }

  generateAddContactForm() {
    this.resetForm()

    let addForm = document.getElementById('add-contact')
    this.view.bindSubmitContactClick(this.handleSubmitContactClick, addForm)
    
    let addTagSelector = document.getElementById('tag-selector')
    this.displayTagCheckBoxes(addTagSelector)
    this.view.bindSelectTags(this.handleSelectTags, addTagSelector)

    this.displayForm('add')
  }

  generateEditForm(data) {
    this.view.createAddEditContactForm('Edit Contact', data)

    let editForm = document.getElementById('edit')
    this.view.bindSubmitContactClick(this.handleEditContactButtons, editForm)
    
    let editTagSelector = document.getElementById('tag-selector-edit')
    this.displayTagCheckBoxes(editTagSelector)
    this.view.bindSelectTags(this.handleSelectTags,  editTagSelector)
  }

  generateContacts(data) {
    this.view.emptyContacts.style.display = 'none'
    let contactList = Handlebars.compile(document.getElementById('contact-list').innerHTML)
    Handlebars.registerPartial('contactTemplate', document.getElementById('contact-template').innerHTML)
    this.view.contactList.innerHTML = contactList({contacts : data})
  }

  deleteContact(event) {
    if (confirm('Are you sure you want to delete this contact?') === true) {
      let id = event.target.closest('li').getAttribute('data-id')
      this.model.deleteContact(id)
      this.renderContacts()
    }
  }

  editContact(event) {
    this.model.editContact(event.currentTarget)
    this.displayHome()
    this.renderContacts()
  }

  getContactData(event) {
    let id = event.target.closest('li').getAttribute('data-id')
    return this.model.contacts.filter(obj => obj.id == id).pop()
  }

  addBackButtonEvent() {
    this.view.backButton.onclick = () => {
      this.resetSearchBar()
      this.displayContacts(this.model.contacts)
      this.view.backButton.remove()
    }
  }

  checkValidForm() {
    if (document.getElementById('name').value === '') {
      alert('You need to provide a valid name to add a contact.')
      return false
    }
    return true
  }

  resetForm() {
    document.getElementById('add-contact').reset()
  }

  resetSearchBar() {
    this.view.searchContactBar.value = ''
  }
}

class View {
  constructor() {
    this.body = this.getElement('body')
    this.createHeader()
    this.createAppContainer()
    this.createAddEditContactForm()
    this.createTagForm()
    this.createMenuBar()
    this.createContactHolder()
    this.addEmptyContacts()
  }

  createElement(tag, className) {
    const element = document.createElement(tag)
    if (className) {
      element.classList.add(className)
    }
    return element
  }

  getElement(selector) {
    const element = document.querySelector(selector)
    return element
  }

  createHeader() {
    // Build header Elements
    this.header = this.createElement('header', 'header')
    this.body.appendChild(this.header)
    this.headerContainer = this.createElement('div', 'container')
    this.header.appendChild(this.headerContainer)

    this.homeTitle = this.createElement('h1')
    this.homeTitle.textContent = 'Contact Manager'

    this.subtitle = this.createElement('p')
    this.subtitle.textContent = "Easily store, add, manage and remove contacts!"

    this.headerContainer.appendChild(this.homeTitle)
    this.headerContainer.appendChild(this.subtitle)
  }

  createAppContainer() {
    // Build Body App
    this.appContainer = this.createElement('div', 'container')
    this.body.appendChild(this.appContainer)
    this.formContainer = this.createElement('div', 'contact-form')
    this.formContainer.id = 'form'
    this.appContainer.appendChild(this.formContainer)
    this.formContainer.style.display = 'none'
  }

  createMenuBar() {
    // Build Contact Bar 
    this.contactBar = this.createElement('div')
    this.contactBar.id = 'menu-bar'
    this.addContactButton = this.createElement('button', 'menu-button')
    this.addContactButton.textContent = "Add Contact"
    this.addContactButton.type = 'button'
    this.addContactButton.classList.add("add-contact-button")

    this.searchContactBar = this.createElement('input')
    this.searchContactBar.type = 'text'
    this.searchContactBar.placeholder = 'Search'

    this.createTagButton = this.createElement('button', 'menu-button')
    this.createTagButton.id = 'create-tag-button'
    this.createTagButton.textContent = "Create Tag"
    this.createTagButton.type = 'button'

    this.contactBar.appendChild(this.addContactButton)
    this.contactBar.appendChild(this.createTagButton)
    this.contactBar.appendChild(this.searchContactBar)
    this.appContainer.appendChild(this.contactBar)
  }

  createContactHolder() {
    // Build Contact Holder/Pen
    this.contactHolder = this.createElement('div')
    this.contactHolder.id = 'contact-holder'
    this.contactList = this.createElement('ul')
    this.contactList.id = 'all-contacts'

    this.contactHolder.appendChild(this.contactList)
    this.appContainer.appendChild(this.contactHolder)
  }

  createAddEditContactForm(title='Create Contact', data) {
    // Build contact form
    this.addEditContactForm = this.createElement('form')
    this.addEditContactForm.id = 'add-contact'
    this.formHeader = this.createElement('h2')
    this.formHeader.textContent = title
    this.addEditContactForm.appendChild(this.formHeader)

    this.addEditContactForm.style.display = 'none' 

    // Add Name Input
    this.groupName = this.createElement('div')
    this.nameLabel = this.createElement('label')
    this.nameLabel.textContent = "Full name:"
    this.nameInput = this.createElement('input')
    this.nameInput.name = "full_name"
    this.nameInput.type = "text"
    this.nameInput.id = "name" 
    this.groupName.appendChild(this.nameLabel)
    this.groupName.appendChild(this.nameInput)
    this.addEditContactForm.appendChild(this.groupName)

    // Add Email Input
    this.groupEmail = this.createElement('div')
    this.emailLabel = this.createElement('label')
    this.emailLabel.textContent = "Email address:"
    this.emailInput = this.createElement('input')
    this.emailInput.name = "email"
    this.emailInput.type = "text"
    this.emailInput.id = "email"
    this.groupEmail.appendChild(this.emailLabel)
    this.groupEmail.appendChild(this.emailInput)
    this.addEditContactForm.appendChild(this.groupEmail)

    // Add Phone Input
    this.groupPhone = this.createElement('div')
    this.phoneLabel = this.createElement('label')
    this.phoneLabel.textContent = "Telephone number:"
    this.phoneInput = this.createElement('input')
    this.phoneInput.name = "phone_number"
    this.phoneInput.type = "text"
    this.phoneInput.id = "phone"
    this.groupPhone.appendChild(this.phoneLabel)
    this.groupPhone.appendChild(this.phoneInput)
    this.addEditContactForm.appendChild(this.groupPhone)

    // Add Tag Selector
    this.tagSelector = this.createElement('div')
    this.tagSelector.id = 'tag-selector'
    this.addEditContactForm.appendChild(this.tagSelector)

    // Add Form Buttons
    this.groupButtons = this.createElement('div')
    this.submitContact = this.createElement('button', 'submit')
    this.submitContact.textContent = "Submit"

    this.cancelContact = this.createElement('button', 'cancel')
    this.cancelContact.textContent = "Cancel"

    this.groupButtons.appendChild(this.submitContact)
    this.groupButtons.appendChild(this.cancelContact)

    this.addEditContactForm.appendChild(this.groupButtons)

    if (data) {
      this.nameInput.value = data.full_name
      this.emailInput.value = data.email
      this.phoneInput.value = data.phone_number
      this.addEditContactForm.setAttribute('data-id', data.id)
      this.addEditContactForm.id = 'edit'
      this.tagSelector.id = 'tag-selector-edit'
    }

    this.formContainer.appendChild(this.addEditContactForm)
  }

  createTagForm() {
    this.tagContainer = this.createElement('div')
    this.tagContainer.id = 'create-tag-form'
    this.tagContainer.style.display = 'none'
    this.appContainer.appendChild(this.tagContainer)

    this.tagContainerHeader = this.createElement('h2')
    this.tagContainerHeader.textContent = "Create Contact Tag"
    this.tagContainer.appendChild(this.tagContainerHeader)

    this.createTagForm = this.createElement('form')
    this.tagContainer.appendChild(this.createTagForm)

    this.tagName = this.createElement('div')
    this.tagLabel = this.createElement('label')
    this.tagLabel.textContent = "Tag Name:"
    this.tagInput = this.createElement('input')
    this.tagInput.name = "tag_name"
    this.tagInput.type = "text"
    this.tagName.appendChild(this.tagLabel)
    this.tagName.appendChild(this.tagInput)
    this.createTagForm.appendChild(this.tagName)

    this.tagButtons = this.createElement('div', 'submit')
    this.submitTag = this.createElement('button')
    this.submitTag.textContent = "Submit"
    this.submitTag.id = 'submit-tag-button'

    this.cancelTag = this.createElement('button', 'cancel')
    this.cancelTag.textContent = "Cancel"
    this.cancelTag.id = 'cancel-tag-button'

    this.tagButtons.appendChild(this.submitTag)
    this.tagButtons.appendChild(this.cancelTag)

    this.createTagForm.appendChild(this.tagButtons)

    this.appContainer.appendChild(this.tagContainer)
  }

  addEmptyContacts() {
    // Build empty contacts placeholder
    this.emptyContacts = this.createElement('div')
    this.emptyContacts.id = 'empty-contacts'
    this.emptyContacts.style.display = 'none'
    this.emptyHeader = this.createElement('h3')
    this.emptyHeader.textContent = "There are no contacts"

    this.addContactButton2 = this.addContactButton.cloneNode(true)
    this.addContactButton2.className = 'add-contact-button'

    this.emptyContacts.appendChild(this.emptyHeader)
    this.emptyContacts.appendChild(this.addContactButton2)
    this.contactHolder.appendChild(this.emptyContacts)
  }

  generateBackButton() {
    this.backButton = this.createElement('button')
    this.backButton.textContent = 'All Contacts'
    this.contactList.appendChild(this.backButton)
  }

  bindClickContactButton(handler) {
    this.body.addEventListener('click', handler)
  }

  bindClickCreateTag(handler) {
    this.createTagButton.addEventListener('click', handler)
  }

  bindSubmitContactClick(handler, element) {
    element.addEventListener('click', handler)
  }

  bindEditDeleteButtons(handler) {
    this.contactList.addEventListener('click', handler)
  }

  bindSelectTags(handler, selector) {
    selector.addEventListener('click', handler)
  }

  bindSubmitTag(handler) {
    this.tagButtons.addEventListener('click', handler)
  }

  bindTagClick(handler) {
    this.contactList.addEventListener('click', handler)
  }

  bindTagHover(handler) {
    this.contactList.addEventListener('mouseover', handler)
  }

  bindKeyUpSearchBar(handler) {
    this.searchContactBar.addEventListener('keyup', handler)
  }
}

document.addEventListener('DOMContentLoaded', e => {
  let app = new Controller(new Model(), new View())
})