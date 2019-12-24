d3.json('data/words.json').then( data => {

    let bubble = new Bubble(data);
    bubble.createGroup();
});
