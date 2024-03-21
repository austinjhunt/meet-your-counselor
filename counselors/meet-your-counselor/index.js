let COUNSELOR_TERRITORIES, SC_NC_CITY_COUNTY_MAP;
// TESTING is true if serving from localhost or 127.0.0.1
let TESTING = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
let BASE_MEET_YOUR_COUNSELORS_URL = TESTING ? '' : `/admission/counselors/meet-your-counselor`;

function delay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}
let createCounselorElement = (counselorObject, numCounselors) => {
  let cContainer = document.createElement("div");
  cContainer.classList.add("counselor");
  let label = "";
  let gridclass = "";
  if (numCounselors > 1) {
    label = counselorObject.name;
    if (numCounselors == 2) {
      gridclass = "span6";
    } else if (numCounselors >= 3) {
      gridclass = "span4";
    }
  } else {
    gridclass = "span12";
    label = `Your admissions counselor is ${counselorObject.name}!`;
  }
  cContainer.classList.add(gridclass);
  let cImage = document.createElement("img");
  cImage.src = `${counselorObject.photo}`;
  let cName = document.createElement("strong");
  cName.textContent = label;
  let cDescription = document.createElement("p");
  // do not display raw HTML; parse the HTML
  cDescription.innerHTML = counselorObject.description;
  let cPageLink = document.createElement("a");
  let firstName = counselorObject.name.split(" ")[0];
  cPageLink.href = counselorObject.pageLink;
  cPageLink.textContent = `Read More About ${firstName}!`;
  cPageLink.classList.add("cta");
  cContainer.appendChild(cImage);
  cContainer.appendChild(cName);
  cContainer.appendChild(cDescription);
  cContainer.appendChild(cPageLink);
  return cContainer;
};

let filterOnlyHighSchools = (schoolMatches) => {
  // lowgrade = '09', highgrade = '12'
  return schoolMatches.filter((school) => school.lowGrade === "09" && school.highGrade === "12");
}

let clearChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};

// wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // get all of the main elements
  let suggestions = document.getElementById("suggestions");
  let counselorInfoContainer = document.getElementById("counselor-info-container");
  let counselorInfoContainerLabel = document.querySelector(".counselor-info-container-label");
  let searchContainer = document.querySelector(".search-container");

  let schoolButtonClickFunction = ({ event, counselors, state, city }) => {

    event.preventDefault(); // prevent the form from submitting and the page from refreshing
    // when a school button is clicked, display the counselor info 
    // corresponding to that school's location 

    counselors = counselors.map((c) => c.counselor);
    counselorInfoContainer.innerHTML = "";
    counselorInfoContainerLabel.innerHTML = "";
    if (counselors.length > 1) {
      counselorInfoContainerLabel.innerHTML = "<h4>Your admission counselor is one of the following people!</h4>";
    }
    counselors.forEach((counselorObj) => {
      let cContainer = createCounselorElement(counselorObj, counselors.length);
      counselorInfoContainer.appendChild(cContainer);
      setTimeout(() => {
        cContainer.classList.add("show");
        cContainer.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }, 500);
    });
  };
  const removeDuplicateCounselorsByEmail = (counselors) => {
    return counselors.filter((counselor, index, self) => {
      return (
        self.findIndex((c) => {
          return c.email === counselor.email;
        }) === index
      );
    });
  };

  $("#school-search").on(
    "input",
    delay((event) => {
      // if enter key was pressed, do nothing (prevent form submission and page refresh)
      if (event.keyCode === 13) {
        return;
      }

      clearChildren(suggestions);
      clearChildren(counselorInfoContainer);
      let val = event.target.value;
      if (val.trim() === "") {
        return;
      } else {
        let url = `${BASE_MEET_YOUR_COUNSELORS_URL}/get-schools.php?q=${encodeURIComponent(val)}`;
        fetch(url)
          .then((response) => response.json())
          .then((data) => filterOnlyHighSchools(data.schoolMatches))
          .then((highSchoolMatches) => {
            if (highSchoolMatches.length === 0) {
              let noResults = document.createElement("p");
              $(noResults).css({ "color": "red", "font-weight": "bold", "font-size": "1.5em", "margin-top": "1em" })
              noResults.textContent = "Sorry, we cannot find a high school with that name! Try a different query.";
              suggestions.appendChild(noResults);
              return;
            }

            // counselors array was here, but should be school-specific
            highSchoolMatches.forEach((element) => {
              let counselors = [];
              if (element.state === "SC") { // as of 3/20/2024, NC not county specific because Justin Lyons manages all NC schools. || element.state === "NC") { 
                let county = SC_NC_CITY_COUNTY_MAP[element.state].filter((el) => el.city === element.city)[0].county;
                // extend counselors array with counselors whose state=element.state and county=county
                counselors.push(
                  ...COUNSELOR_TERRITORIES.filter(
                    (counselor) =>
                      counselor.territories.filter(
                        (t) => t.state.replaceAll(".", "").trim() == element.state && t.county.trim() == county
                      ).length > 0
                  )
                );
                counselors = removeDuplicateCounselorsByEmail(counselors);
              } else {
                counselors.push(
                  ...COUNSELOR_TERRITORIES.filter(
                    (counselor) =>
                      counselor.territories.filter((t) => t.state.replaceAll(".", "").trim() == element.state).length >
                      0
                  )
                );
                counselors = removeDuplicateCounselorsByEmail(counselors);
              }

              let schoolButton = document.createElement("button");
              ["school-button", "btn", "btn--primary-small"].forEach((cls) => {
                schoolButton.classList.add(cls);
              });

              schoolButton.innerHTML = `
                <span class="text">${element.schoolName} - ${element.city}, ${element.state}</span>`;
              schoolButton.id = element.schoolid;
              suggestions.appendChild(schoolButton);
              document.getElementById(schoolButton.id).addEventListener("click", (e) => {
                schoolButtonClickFunction({ event: e, counselors: counselors, state: element.state, city: element.city });
              });
            });
          }).catch((err) => {
            console.error(err);
          });
      }
    }, 1000)
  );

  const fetchAndStoreGlobalData = () => {
    // globally store the counselor territories and the SC/NC city-county map
    // by fetching from PHP files which relay JSON file content from CMS
    fetch(`${BASE_MEET_YOUR_COUNSELORS_URL}/counselor-territories.php`)
      .then((response) => response.json())
      .then((data) => {
        COUNSELOR_TERRITORIES = data;
      });
    fetch(`${BASE_MEET_YOUR_COUNSELORS_URL}/sc-nc-city-county-map.php`)
      .then((response) => response.json())
      .then((data) => {
        SC_NC_CITY_COUNTY_MAP = data;
      });
  }
  fetchAndStoreGlobalData();

  $("#student-type-selector").on("change", (event) => {
    // only show the search container if the student type is "First-Year"
    let counselors;
    let v = event.target.value;
    counselorInfoContainer.innerHTML = "";
    counselorInfoContainerLabel.innerHTML = "";
    if (v != "First-Year") {
      searchContainer.style.display = "none";
      counselors = COUNSELOR_TERRITORIES.filter((c) => c.otherResponsibilities.includes(v));
      if (counselors.length > 1) {
        counselorInfoContainerLabel.innerHTML = "<h4>Your admission counselor is one of the following people!</h4>";
      }
      counselors.forEach((counselor) => {
        let cContainer = createCounselorElement(counselor.counselor, counselors.length);
        counselorInfoContainer.appendChild(cContainer);
        setTimeout(() => {
          cContainer.classList.add("show");
          cContainer.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }, 500);
      });
    } else {
      searchContainer.style.display = "block";
    }
  });
});
