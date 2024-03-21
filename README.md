# Meet Your Counselor
This project was put together for College of Charleston's Admissions website to give students an easy way of finding their specific admission counselor based on the high school they attend(ed). The live version can be found [here on the charleston.edu site](https://charleston.edu/admission/counselors). CofC Admissions previously had a problem on their site; they statically listed all admission counselors in their site navigation, and nearly every student who visited their site looking for counselor information would simply click the first Admission counselor in the list of counselors even if their counselor was someone else. I was charged with making it more interactive to allow students to more accurately identify their CofC Admission counselor.

## Information Gathering / Data Requirements 
In collaboration with University Marketing and Admissions, we gathered requirements around the relationships between counselors, territories, and categories of students. 
A couple of key notes came from these discussions:
- Admission counselor territories are broken down into counties for NC and SC
- Admission counselor territories are simply based on the state outside of NC and SC
- A given admission counselor may cover multiple territories
- A given territory may be covered by multiple admission counselors
- For non-first-year students, there are a set of student categories (e.g. Military/Veteran, International, 60+, etc.) and each category is covered by one or more admission counselors
- For first year students, determining who their counselor is comes down to knowing the location of the high school they attended 
  
## Page Flow 
Based on these requirements, the planned flow of the webpage (to be visited by students) was as follows: 
1. Choose what kind of student you are. This is a dropdown with one option per student category (e.g. Military/Veteran, International, 60+, etc.) with the first option being First Year Student.
2. If the student doesn't choose First Year Student, show the Admission counselors covering that chosen category using a [counselor territories map](counselor-territories-data.json). Easy peasy. 
3. If the student does choose First Year Student, they need to enter the name of the high school they attended. Once chosen, we extract the location of that school (more on this below in the **SchoolDigger** section). The locations are mapped to Admission counselors via the same [counselor territories map](counselor-territories-data.json). Non-SC/Non-NC states are mapped simply to counselors. For NC and SC, the map to counselors includes state _and_ the county. As of 3/20/2024, the per-county logic has been removed for NC but remains for SC.
4. Once the admission counselor(s) corresponding to the selected option is identified, their contact information with a link to their profile is displayed. If there are multiple counselors corresponding to the selected option, include language like "Your admission counselor is one of the following people: ..."

## Data Storage and Access
### Schools & Locations
Of course, to achieve this, we need an authoritative source for school data, such that when a (first-year) student is typing in the name of their school, we can query that source (an API), find schools (partially) matching the entered name, and allow the student to choose from one of the returned school matches. From that point, we need to be able to extract location data from the chosen school in order to map their selection over to an admission counselor since first year student admission counselors are each responsible for some set of geographical territories (e.g. Charleston, SC; Belton, SC; Charlotte, NC; MI; WA; TX;).

#### SchoolDigger
We identified [SchoolDigger](https://developer.schooldigger.com/) as our authoritative data source for school data (which includes much more than just high school data) and procured (bought with a PCard) an Enterprise license ($189/month) to use their API. We now are using a SchoolDigger application titled "CofC Find Your Admissions Counselor".

#### Mapping Cities to Counties in SC and NC 
One important thing to note about SchoolDigger API responses is that for each matched school in the response, we have "city" as an attribute but not "county". Since admission counselors for first year students are broken up by county (not city) in SC and NC, I needed to map cities to counties in SC and NC in order to use the SchoolDigger responses. I used [this resource](https://www.sog.unc.edu/resources/microsites/knapp-library/cities-north-carolina) to gather the list of cities and their respective counties in NC, and [this resource](https://scdmh.net/contact/sc-cities-towns-and-counties/) to do the same for cities in SC. Each of those pages presents the information as a less-than-usable table, so for each one I actually used a small bit of JS to extract the table information into a JSON array, whose value can be seen in [sc-nc-county-map-data.json](sc-nc-county-map-data.json). This file is read into a global JS variable via a [PHP API endpoint](sc-nc-city-county-map.php) on the initial page load, and is used specifically when a chosen school is in NC or SC. 

### Cascade CMS
In Cascade, there is a content type for Admission Counselor pages that includes fields for the name, photo, email address, a short bio, optional geographical territories (if any), and optional non-geographical responsibilities (if any; e.g. Military/Veteran Students, International Students, 60+ students, etc). 

Then, there is a [counselor territories map](counselor-territories-data.json) file that gets dynamically populated with a Velocity format by looping over the folder of all of the Admission Counselor pages, which collects into a JSON array all of the counselors and their respective contact info, bios, territories, and responsibilities. This data file is the biggest driver for the logic of the Meet Your Counselor form. The map is loaded into a global JS variable via a [PHP API endpoint](counselor-territories.php) on the initial page load, similar to the cities/counties map for NC and SC. It's reused heavily. 

## Calling SchoolDigger API
Since each call to the SchoolDigger API requires that the app ID and the app key are passed as query parameters for authentication, this call was not implemented on the client side with JavaScript (to prevent exposing those values). Instead, there is a [proxy PHP API endpoint built with a simple PHP script](get-schools.php) that consumes the client school name query, calls the SchoolDigger API with that query (and credentials), and relays the response back to the client. The client never interacts directly with SchoolDigger. 

