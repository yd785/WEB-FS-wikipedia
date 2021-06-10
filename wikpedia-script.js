const ELEMENTS = {
    $TOTALPAGES_TITLE: $('.total-pages-title'),
    $SEARCH_FORM: $('#search-wiki-form'),
    $SEARCH_INPUT: $('#search-wiki-form input[type="search"]'),
    $SEARCH_BUTTON: $('.search-btn'),
    $SHOW_FAVORITES_BUTTON: $('.show-favorite-btn'),
    $SEARCH_RESULT: $('.search-results'),
    $FAVORITES_MODAL_BODY: $('.modal .modal-body'),
    $TOTLAL_PAGES: $('.total-pages-title'),
    $NAV_NEXT_BTN: $('.navigation-control next-btn'),
    $NAV_PREV_BTN: $('.navigation-control prev-btn'),
    $NAV_CONTROLS: $('.navigation-control')

}

const STORAGE_FAV_KEY = "favoritesPages";

const state = {
    queryResultPages: [],
    favoritesPages: [],
    query: ""
}

$(function () {
    main();
})

function main() {
    loadsFavoriteWikiPages();
    updateFavoritesInModal();
    initSearchForm();
}

function loadsFavoriteWikiPages() {
    const favPages = loadFromLocalStorage(STORAGE_FAV_KEY) || [];
    $.each(favPages, function (_, favPage) {
        state.favoritesPages.push(favPage);
    });
}

function initSearchForm() {
    ELEMENTS.$SEARCH_FORM.submit(onSearchQuery);
    ELEMENTS.$SEARCH_INPUT.on('keyup',  function (event) {
        // Checking if key pressed is ENTER or not
        // if the key pressed is ENTER
        // click listener on button is called
        if (event.keyCode == 13) {
            ELEMENTS.$SEARCH_BUTTON.click();
        }
     });
}

function onSearchQuery(event) {
    event.preventDefault();

    const query = ELEMENTS.$SEARCH_INPUT.val();
    state.query = query;
    const queryURL = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json`;

    fetchSearcResult(queryURL, result => {
        if (result.continue)
            renderPageNavigation();
        handleLoadingPage(result, 2);
    });
}

function fetchSearcResult(queryURL, onFetchedResult) {
    $.ajax(queryURL, {
        dataType: 'jsonp',
        success: (queryResult) => {
            //updateUIResult(queryResult)
            onFetchedResult(queryResult);
        },
        error: function (_, _, thrownError) {
            alert(thrownError);
        }
    });
}

function handleLoadingPage(queryResult, navigate) {
    if (queryResult)
        state.nPageOffset = queryResult.continue ? queryResult.continue.sroffset : -1;

    checkNavigationBtnStatus();

    if (navigate === 2) {  
        updateUIResult(queryResult);
        return;
    }

    const queryUrlBase = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${state.query}&format=json`;
    if(navigate === 1) {
        fetchSearcResult(queryUrlBase + `&sroffset=${state.nPageOffset}`, result => handleLoadingPage(result, 2));
        
    } else {     
        state.nPageOffset -= 20;
        fetchSearcResult(queryUrlBase + `&sroffset=${state.nPageOffset}`, result => handleLoadingPage(result, 2));
    }
}

function checkNavigationBtnStatus() {
    if(state.nPageOffset === -1) {
        ELEMENTS.$NAV_NEXT_BTN.prop('disabled', true);
        return;
    }

    if(state.nPageOffset === 10) {
        console.log("disabled");
        //ELEMENTS.$NAV_PREV_BTN.prop('disabled', true);
        ELEMENTS.$NAV_CONTROLS.find('.prev-btn').prop('disabled', true);
        return;
    }

    ELEMENTS.$NAV_NEXT_BTN.prop('disabled', false);
    ELEMENTS.$NAV_CONTROLS.find('.prev-btn').prop('disabled', false);
    //ELEMENTS.$NAV_PREV_BTN.prop('disabled', false);
}

function renderPageNavigation() {
    ELEMENTS.$NAV_CONTROLS.empty();
    const $navigationcontrolsEl = $(`
            <button class="prev-btn" type="button">Prev</button>
            <button class="next-btn" type="button">Next</button>
    `);

    ELEMENTS.$NAV_CONTROLS.append($navigationcontrolsEl);

   // ELEMENTS.$NAV_CONTROLS.find('.prev-btn').prop('disabled', true);
    ELEMENTS.$NAV_CONTROLS.find('.prev-btn').on('click', () => handleLoadingPage(null, -1));
    ELEMENTS.$NAV_CONTROLS.find('.next-btn').on('click', () => handleLoadingPage(null, 1));
}

function updateUIResult(queryResult) {
    ELEMENTS.$SEARCH_RESULT.empty();
    const pagesResults = queryResult.query.search;
    
    state.queryResultPages.splice(0, state.queryResultPages.length);
    $.each(pagesResults, function (_, page) {
        state.queryResultPages.push(page);
        const $pageResultEl = createResultElement(page);
        const $favBtnEl = $pageResultEl.find('.favorite-btn');
        $favBtnEl.on('click', () => saveInFavorites(page));
        ELEMENTS.$SEARCH_RESULT.append($pageResultEl);
    });

    ELEMENTS.$TOTLAL_PAGES.html(`<h3>Total pages: ${queryResult.query.searchinfo.totalhits}</h3>`);
    ELEMENTS.$SEARCH_RESULT.find('.searchmatch').css('background-color', 'yellow');

}

function createResultElement(page) {
    const $pageResultEl = $(`<div>
                                <span class='result-title'>
                                    ${createWikiPageLink(page.title)}
                                </span>
                                 <span class="badge bg-secondary">${page.wordcount}</span>
                                <button type="button" class="btn btn-sm btn-danger favorite-btn">favorite</button>
                                <p class="snipest">${page.snippet}</p>
                            </div>`);
    return $pageResultEl;
}

function createWikiPageLink(title) {
    return `<a target="_blank" href="https://en.wikipedia.org/wiki/${title.replace(' ', '_')}">${title}</a>`;
}

function updateFavoritesInModal() {
    $.each(state.favoritesPages, function (_, favPage) {
        renderFavoriteInModal(favPage);
    });
}

function renderFavoriteInModal(favPage) {
    const $favoriteEl = $(`<div>${createWikiPageLink(favPage.title)}</div>`);
    ELEMENTS.$FAVORITES_MODAL_BODY.append($favoriteEl);
}

function saveInFavorites(favPage) {
    const isFavoriteExist = state.favoritesPages.some(currPage => currPage.pageid === favPage.pageid);
    if (isFavoriteExist) return;
    state.favoritesPages.push(favPage);
    saveToLocalStorage(STORAGE_FAV_KEY, state.favoritesPages);
    renderFavoriteInModal(favPage);
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

