import UUID "mo:uuid/UUID";
import Source "mo:uuid/async/SourceV4";

module GettingStartedTemplate {

    type Template = [{
        #heading : { title : Text; uuid : UUID.UUID };
        #heading3 : { title : Text; uuid : UUID.UUID };
        #text : { title : Text; uuid : UUID.UUID };
        #todoList : { title : Text; uuid : UUID.UUID; checked : Bool };
        #bulletedList : { title : Text; uuid : UUID.UUID };
        #numberedList : { title : Text; uuid : UUID.UUID };
        #code : { title : Text; uuid : UUID.UUID };
        #quote : { title : Text; uuid : UUID.UUID };
        #callout : { title : Text; uuid : UUID.UUID };
    }];

    func build() : async Template {
        [
            #heading({
                title = "Welcome to your private workspace";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "Here, you can create pages to track yours ideas, plan projects, or whatever else your heart desires!";
                uuid = await Source.Source().new();
            }),
            #heading({
                title = "Pages are made of blocks";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "A block is an element that can display text in different formats, depending on the type of block. Blocks enable you to easily compose pages with different layouts.";
                uuid = await Source.Source().new();
            }),
            // #text({
            //     title = "Blocks can be text, images, code, or even other pages!";
            //     uuid = await Source.Source().new();
            // }),
            #text({
                title = "There are many types of blocks and many more to come!";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "Here are a few examples:";
                uuid = await Source.Source().new();
            }),
            // Todo List
            #heading3({
                title = "Todo List";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "Mental Health Checklist";
                uuid = await Source.Source().new();
            }),
            #todoList({
                title = "Meditate";
                uuid = await Source.Source().new();
                checked = true;
            }),
            #todoList({
                title = "Exercise";
                uuid = await Source.Source().new();
                checked = true;
            }),
            #todoList({
                title = "DCA";
                checked = true;
                uuid = await Source.Source().new();
            }),
            // Bulleted List
            #heading3({
                title = "Bulleted List";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "Favorite things about the Sun";
                uuid = await Source.Source().new();
            }),
            #bulletedList({
                title = "Sunrise";
                uuid = await Source.Source().new();
            }),
            #bulletedList({
                title = "Sunset";
                uuid = await Source.Source().new();
            }),
            #bulletedList({
                title = "Sunday Driving";
                uuid = await Source.Source().new();
            }),
            // Numbered List
            #heading3({
                title = "Numbered List";
                uuid = await Source.Source().new();
            }),
            #text({
                title = "Best anime heroes";
                uuid = await Source.Source().new();
            }),
            #numberedList({ title = "Goku"; uuid = await Source.Source().new() }),
            #numberedList({
                title = "Naruto";
                uuid = await Source.Source().new();
            }),
            #numberedList({
                title = "Gon";
                uuid = await Source.Source().new();
            }),
            #numberedList({
                title = "Midoriya";
                uuid = await Source.Source().new();
            }),
            // Code
            #heading3({ title = "Code"; uuid = await Source.Source().new() }),
            #code({ title = "Code"; uuid = await Source.Source().new() }),
            // Quote
            #heading3({ title = "Quote"; uuid = await Source.Source().new() }),
            #quote({
                title = "\"Let that sink in\" - Elon Musk";
                uuid = await Source.Source().new();
            }),
            // Callout
            #heading3({ title = "Callout"; uuid = await Source.Source().new() }),
            #callout({
                title = "Remember! Your dreams are always within reach!";
                uuid = await Source.Source().new();
            }),
        ];
    };
};
