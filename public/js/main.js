// Main JavaScript file for IMO platform

import * as bootstrap from "bootstrap"

document.addEventListener("DOMContentLoaded", () => {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  popoverTriggerList.map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl))

  // Add active class to current nav item
  const currentLocation = window.location.pathname
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link")

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")
    if (linkPath === "/" && currentLocation === "/") {
      link.classList.add("active")
    } else if (linkPath !== "/" && currentLocation.startsWith(linkPath)) {
      link.classList.add("active")
    }
  })
})
