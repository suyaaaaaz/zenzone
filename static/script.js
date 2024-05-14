$(document).ready(function () {
    $('#post').click(function () {
        $('#modal-post').removeClass('is-hidden')
        $(this).prop('disabled', true)
        $("#overlay").show();
    })

    $('#xmark').click(function () {
        $('#modal-post').toggleClass('is-hidden')
        $('#post').prop('disabled', false)
        $("#overlay").hide();
    })

    $('#posting').click(function () {
        let text = $('#text-input').val()
        if (text === '') {
            $("#help-posting")
                .text("Please enter a text")
                .removeClass("is-safe")
                .addClass("is-danger")
            return
        }
        let today = new Date().toISOString()
        $.ajax({
            type: 'POST',
            url: '/posting',
            data: {
                text_give: text,
                date_give: today
            },
            success: function () {
                $('#modal-post').toggleClass('is-hidden')
                window.location.reload()
            }
        })
    })

    $('#signin').click(function () {
        let username = $("#username").val()
        let password = $("#userpw").val()
        let password2 = $("#userpw-c").val()

        console.log(username, password, password2)

        if (username === '') {
            $('#help-un')
                .text('Please enter yuour username')
                .removeClass('is-safe')
                .addClass('is-danger')
            $('#username').focus()
            return
        }

        if (!is_username(username)) {
            $('#help-un')
                .text('Please enter a valid username')
                .removeClass('is-safe')
                .addClass('is-danger')
            $('#username').focus()
            return
        }

        if (password === "") {
            $("#help-password")
                .text("Please enter your password")
                .removeClass("is-safe")
                .addClass("is-danger")
            $("#userpw").focus()
            return
        } else if (!is_password(password)) {
            $("#help-password")
                .text("Please check your password. For your password, please enter 8-20 English characters, numbers, or the following special characters (!@#$%^&*)")
                .removeClass("is-safe")
                .addClass("is-danger");
            $("#userpw").focus();
            return;
        } else {
            $("#help-password")
                .text("This password can be used!")
                .removeClass("is-danger")
                .addClass("is-success");
        }
        if (password2 === "") {
            $("#help-password2")
                .text("Please enter your password")
                .removeClass("is-safe")
                .addClass("is-danger");
            $("#userpw-c").focus();
            return;
        } else if (password2 !== password) {
            $("#help-password2")
                .text("Your passwords do not match")
                .removeClass("is-safe")
                .addClass("is-danger");
            $("#userpw-c").focus();
            return;
        } else {
            $("#help-password2")
                .text("Your passwords match")
                .removeClass("is-danger")
                .addClass("is-success");
        }
        $.ajax({
            type: "POST",
            url: "/sign_up/save",
            data: {
                un_give: username,
                pw_give: password,
            },
            success: function (response) {
                if (response['exists']) {
                    $("#help-un")
                        .text("This username has been used, please try another one")
                        .removeClass('is-safe')
                        .addClass('is-danger')
                    $("#username").focus();
                } else {
                    $("#help-un")
                        .text('this username is available')
                        .removeClass('is-danger')
                        .addClass('is-success')

                    alert("Your are signed up! Nice!");
                    window.location.replace("/login");
                }

            },

        });
    })

    $('#sign_up, #already').click(function () {
        $('#c-userpw-c').toggleClass('is-hidden');
        $('#signin, #login').toggleClass('is-hidden');
        $('#already, #sign_up').toggleClass('is-hidden');
    });

    function is_username(asValue) {
        var regExp = /^(?=.*[a-zA-Z])[-a-zA-Z0-9]{3,10}$/;
        return regExp.test(asValue);
    }

    function is_password(asValue) {
        var regExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*]{8,20}$/;
        return regExp.test(asValue);
    }

    $('#login').click(function () {
        let username = $("#username").val()
        let password = $("#userpw").val()

        if (username === '') {
            $('#help-un')
                .text('Please enter yuour username')
                .removeClass('is-safe')
                .addClass('is-danger')
            $('#username').focus()
            return
        }
        if (password === "") {
            $("#help-password")
                .text("Please enter your password")
                .removeClass("is-safe")
                .addClass("is-danger")
            $("#userpw").focus()
            return
        }

        $.ajax({
            type: 'POST',
            url: '/sign_in',
            data: {
                un_give: username,
                pw_give: password
            },
            success: function (response) {
                if (response.result === 'success') {
                    $.cookie('mytoken', response['token'], { path: '/' })
                    window.location.replace('/')
                } else {
                    alert(response['msg'])
                }
            }
        })
    })
})






function time2str(date) {
    let today = new Date()
    let time = (today - date) / 1000 / 60
    if (time < 60) {
        return parseInt(time) + 'm'
    }
    time = time / 60
    if (time < 24) {
        return parseInt(time) + 'h'
    }
    time = time / 24
    if (time < 7) {
        return parseInt(time) + 'd'
    }
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    return `${day} ${month} ${year}`
}






function get_posts(username) {
    
    if (username == undefined) {
        username = ''
    }
    console.log(username)
    $("#box-post").empty();
    $.ajax({
        type: "GET",
        url: `/get_post?un_give=${username}`,
        data: {},
        success: function (response) {
            if (response["result"] === "success") {
                let posts = response["posts"];
                posts.forEach(function (post) {
                    let time_post = new Date(post["date"]);
                    let time_before = time2str(time_post);
                    let class_heart = "fa-regular"
                    if (post["heart_by_me"]) {
                        class_heart = "fa-solid"
                    } else {
                        class_heart = "fa-regular"
                    }

                    let class_star = "fa-regular"
                    if (post["star_by_me"]) {
                        class_star = "fa-solid"
                    } else {
                        class_star = "fa-regular"
                    }

                    let class_tumb = "fa-regular"
                    if (post["tumb_by_me"]) {
                        class_tumb = "fa-solid"
                    } else {
                        class_tumb = "fa-regular"
                    }
                    let html_temp = `<div class="is-flex is-justify-content-center" id="${post['_id']}">
                        <div style="width: 600px;">
                            <div class="is-flex ">
                                <figure style="align-self: flex-start" class="is-flex mr-4">
                                    <a class="image is-32x32" href="/user/${post['username']}">
                                        <img class="is-rounded" src ="../static/${post['profile_pic_real']}">
                                    </a>
                                    
                                </figure>
                    
                                <div>
                                    <div class="is-flex is-align-items-center">
                                    <h2 class="is-size-5 has-text-weight-semibold">${post["profile_name"]}</h2>
                                    <p class="is-size-6 ml-3 has-text-grey">${time_before}</p>
                                    </div>
                                    <p>${post['text']}</p>
                
                                    <div class="mt-3">
                                        <nav class="level is-mobile">
                                            <div class="level-left">
                                                <a class="level-item" aria-label="heart" onclick="toggle_like('${post["_id"]}', 'heart')">
                                                    <span class="icon is-small">
                                                        <i class="${class_heart} fa-heart" area-hidden="true"></i>
                                                    </span>&nbsp; <span class="like-num">${num2str(post["count_heart"])}</span>
                                                </a>

                                                <a class="level-item" aria-label="star" onclick="toggle_star('${post["_id"]}', 'star')">
                                                    <span class="icon is-small">
                                                        <i class="${class_star} fa-star" area-hidden="true"></i>
                                                    </span>&nbsp; <span class="like-num">${num2str(post["count_star"])}</span>
                                                </a>

                                                <a class="level-item" aria-label="tumb" onclick="toggle_tumb('${post["_id"]}', 'tumb')">
                                                    <span class="icon is-small">
                                                        <i class="${class_tumb} fa-thumbs-up" area-hidden="true"></i>
                                                    </span>&nbsp; <span class="like-num">${num2str(post["count_tumb"])}</span>
                                                </a>
                                            </div>
                                        </nav>
                                    </div>
                                    
                                </div>
                                
                            </div>
                            
                            <hr>
                        </div>
                    </div>`
                    $("#box-post").append(html_temp)
                })
            }
        },
    });
}

function num2str(count) {
    if (count > 10000) {
        return parseInt(count / 1000) + "k"
    }
    if (count > 500) {
        return parseInt(count / 100) / 10 + "k"
    }
    if (count == 0) {
        return ""
    }
    return count
}

function toggle_like(post_id, type) {
    console.log(post_id, type);
    let $a_like = $(`#${post_id} a[aria-label='heart']`)
    let $i_like = $a_like.find("i");

    if ($i_like.hasClass("fa-solid")) {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "unlike",
            },
            success: function (response) {
                console.log("unlike");
                $i_like.addClass("fa-regular").removeClass("fa-solid");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        });
    } else {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "like",
            },
            success: function (response) {
                console.log("like");
                $i_like.addClass("fa-solid").removeClass("fa-regular");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        })
    }
}


function toggle_star(post_id, type) {
    console.log(post_id, type);
    let $a_like = $(`#${post_id} a[aria-label='star']`)
    let $i_like = $a_like.find("i");

    if ($i_like.hasClass("fa-solid")) {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "unlike",
            },
            success: function (response) {
                console.log("unlike");
                $i_like.addClass("fa-regular").removeClass("fa-solid");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        });
    } else {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "like",
            },
            success: function (response) {
                console.log("like");
                $i_like.addClass("fa-solid").removeClass("fa-regular");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        })
    }
}

function toggle_tumb(post_id, type) {
    console.log(post_id, type);
    let $a_like = $(`#${post_id} a[aria-label='tumb']`)
    let $i_like = $a_like.find("i");

    if ($i_like.hasClass("fa-solid")) {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "unlike",
            },
            success: function (response) {
                console.log("unlike");
                $i_like.addClass("fa-regular").removeClass("fa-solid");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        });
    } else {
        $.ajax({
            type: "POST",
            url: "/up_like",
            data: {
                post_id_give: post_id,
                type_give: type,
                action_give: "like",
            },
            success: function (response) {
                console.log("like");
                $i_like.addClass("fa-solid").removeClass("fa-regular");
                $a_like.find("span.like-num").text(num2str(response["count"]));
            },
        })
    }
}



function update_profile() {
    let name = $("#input-name").val();
    let file = $("#input-pic")[0].files[0];
    let about = $("#textarea-about").val();
    let form_data = new FormData();
    form_data.append("file_give", file);
    form_data.append("name_give", name);
    form_data.append("about_give", about);
    console.log(name, file, about, form_data);

    $.ajax({
        type: "POST",
        url: "/up_profile",
        data: form_data,
        cache: false,
        contentType: false,
        processData: false,
        success: function (response) {
            if (response["result"] === "success") {
                alert(response["msg"]);
                window.location.reload();
            }
        },
    });
}

function sign_out() {
    $.removeCookie('mytoken', { path: '/' });
    alert('Signed out!');
    window.location.href = "/login";
}