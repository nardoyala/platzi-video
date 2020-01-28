
(async function load() {
    // await
    
    async function getUser(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    async function getData(url) {
        const response = await fetch(url);
        const data = await response.json();
        if (data.data.movie_count > 0) {
            return data;
        }
        throw new Error('No se encontró ningún resultado');
    }
    
    const $form = document.querySelector('#form');
    const $home = document.querySelector('#home');
    const $featuringContainer = document.querySelector('#featuring');
    
    function setAttributes($element, attributes) {
        for (const attribute in attributes) {
            $element.setAttribute(attribute, attributes[attribute]);
        }
    }
    
    const BASE_API = 'https://yts.lt/api/v2/';

    function myPlaylistTemplate (movie){
        return (
            `
            <li class="myPlaylist-item">
                <a href="#">
                    <span>
                        ${movie.title}
                    </span>
                </a>
            </li>
            `
        )
    }

    function playlistFriendsTemplate (user) {
        return (
            `
            <li class="playlistFriends-item">
                <a href="#">
                    <img src="${user.picture.thumbnail}" alt="profile-picture" />
                    <span>
                        ${user.name.first} ${user.name.last}
                    </span>
                </a>
            </li>
            `
        )
    }

    function featuringTemplate (peli) {
        return (
            `
            <div class="featuring">
              <div class="featuring-image">
                <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
             </div>
             <div class="featuring-content">
                <p class="featuring-title">Pelicula encontrada</p>
                <p class="featuring-album">${peli.title}</p>
              </div>
            </div>
            `
        )
    }
    
    $form.addEventListener('submit', async (event) => {
        event.preventDefault();
        $home.classList.add('search-active');
        const $loader = document.createElement('img');
        setAttributes($loader, {
            src: 'src/images/loader.gif',
            height: 50,
            width: 50,
        })
        $featuringContainer.append($loader);

        const data = new FormData($form);
        try {
            const {
                data: {
                    movies: pelis
                }
            } = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get('name')}`)
            const HTMLString = featuringTemplate(pelis[0]);
            $featuringContainer.innerHTML = HTMLString;
        } catch(error) {
            alert(error.message);
            $loader.remove();
            $home.classList.remove('search-active');
        }
    })

    function videoItemTemplate(movie, category) {
        return (
            `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category=${category}>
                <div class="primaryPlaylistItem-image">
                    <img src="${movie.medium_cover_image}">
                </div>
                <h4 class="primaryPlaylistItem-title">
                    ${movie.title}
                </h4>
            </div>`
        )
    }

    
    function createTemplate(HTMLString) {
        const html = document.implementation.createHTMLDocument();
        html.body.innerHTML = HTMLString;
        return html.body.children[0];
    }
    function addEventClick($element) {
        $element.addEventListener('click', () => {
            showModal($element)
        })
    }
        
    function renderPlaylisFriends(list, $container) {
        list.forEach((user) => {
            const HTMLString = playlistFriendsTemplate(user);
            const playlistElement = createTemplate(HTMLString);
            $container.append(playlistElement);
        })
    }

    function renderMovieList(list, $container, category) {
        $container.children[0].remove();
        list.forEach((movie) => {
            const HTMLString = videoItemTemplate(movie, category);
            const movieElement = createTemplate(HTMLString);
            $container.append(movieElement);
            const image = movieElement.querySelector('img');
            image.addEventListener('load', (event) => {
                event.srcElement.classList.add('fadeIn');
            })
            addEventClick(movieElement);
        })
    }

    async function cacheExist(category) {
        const listName =  `${category}List`;
        const cacheList = window.localStorage.getItem(listName);
        if (cacheList) {
            return JSON.parse(cacheList);
        }
        const {data: {movies: data}} = await getData(`${BASE_API}list_movies.json?genre=${category}`)
        window.localStorage.setItem(listName, JSON.stringify(data));
        return data;
    }

    async function cacheExistPlaylist(category) {
        const listName =  `${category}List`;
        const cacheList = window.localStorage.getItem(listName);
        if (cacheList) {
            return JSON.parse(cacheList);
        }
        const {data: {movies: data}} = await getData(`${BASE_API}list_movies.json?limit=10`)
        window.localStorage.setItem(listName, JSON.stringify(data));
        return data;
    }

    async function cacheExistFriendsPlaylist() {
        const listName = 'userList';
        const cacheList = window.localStorage.getItem(listName);
        if (cacheList) {
            return JSON.parse(cacheList)
        }
        const { results: userList } = await getUser('https://randomuser.me/api/?results=8');
        window.localStorage.setItem(listName, JSON.stringify(userList));
        return userList;
    }

    function renderMyPlaylist(list, $container) {
        list.forEach((movie) => {
            const HTMLString = myPlaylistTemplate(movie);
            const myPlaylistElement = createTemplate(HTMLString);
            $container.append(myPlaylistElement);
        })
    }
    
    const movieList = await cacheExistPlaylist('movie')
    const $myPlaylist = document.querySelector('.myPlaylist');
    renderMyPlaylist(movieList, $myPlaylist);

    const userList= await cacheExistFriendsPlaylist();
    const $playListFriends = document.querySelector('.playlistFriends');
    renderPlaylisFriends(userList, $playListFriends);
    
    // const {data: {movies: actionList}} = await getData(`${BASE_API}list_movies.json?genre=action`)
    const actionList = await cacheExist('action')
    const $actionContainer = document.querySelector('#action'); 
    renderMovieList(actionList, $actionContainer, 'action');
    
    const dramaList = await cacheExist('drama')
    const $dramaContainer = document.querySelector('#drama');
    renderMovieList(dramaList, $dramaContainer, 'drama');
    
    const animationList = await cacheExist('animation')
    const $animationContainer = document.querySelector('#animation');
    renderMovieList(animationList, $animationContainer, 'animation');
  
    
  
    const $modal = document.getElementById('modal');
    const $overlay = document.getElementById('overlay');
    const $hideModal = document.getElementById('hide-modal');

    const $modalTitle = $modal.querySelector('h1');
    const $modalImage = $modal.querySelector('img');
    const $modalDescription = $modal.querySelector('p');


    function findById(list, id) {
        return list.find(movie => movie.id === parseInt(id, 10))
    }
    function findMovie(id, category) {
        switch (category) {
            case 'action' : {
                return findById(actionList, id)
            }
            case 'drama' : {
                return findById(dramaList, id)
            }
            default: {
                return findById(animationList, id)
            }
        }
    }
    
    function showModal($element) {
        $overlay.classList.add('active');
        $modal.style.animation = 'modalIn .8s forwards';
        const id = $element.dataset.id;
        const category = $element.dataset.category;
        const data = findMovie(id, category);
        $modalTitle.textContent = data.title; 
        $modalImage.setAttribute('src', data.medium_cover_image); 
        $modalDescription.textContent = data.description_full;
    }

    $hideModal.addEventListener('click', hideModal);
    function hideModal() {
        $overlay.classList.remove('active');
        $modal.style.animation = 'modalOut .8s forwards';
    }

})()