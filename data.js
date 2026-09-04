export const businesses = [
  {
    id:'crunch', name:'Crunch', type:'Fast Food', eta:'20–30 min', fee:2.99,
    description:'Burgers, chicken, loaded fries, shakes & more.',
    categories:{
      Burgers:[
        {id:'crunch_smash',name:'Crunch Smash',price:7.99},
        {id:'inferno_melt',name:'Inferno Melt',price:8.49},
        {id:'backyard',name:'The Backyard',price:8.49},
        {id:'triple_stackd',name:"Triple Stack'd",price:9.99}
      ],
      Chicken:[
        {id:'crunch_chicken',name:'Crunch Chicken',price:7.49},
        {id:'hot_crunch',name:'Hot Crunch',price:7.49},
        {id:'honey_crunch',name:'Honey Crunch',price:7.49},
        {id:'crunch_tenders',name:'Crunch Tenders',price:6.99},
        {id:'crunch_bites',name:'Crunch Bites',price:4.49}
      ],
      Sides:[
        {id:'crunch_fries',name:'Crunch Fries',price:3.29},
        {id:'loaded_crunch_fries',name:'Loaded Crunch Fries',price:5.99},
        {id:'crunch_rings',name:'Crunch Rings',price:3.99},
        {id:'mac_crunch_bites',name:'Mac Crunch Bites',price:3.99},
        {id:'mozza_pulls',name:'Mozza Pulls',price:3.99},
        {id:'fried_pickle_chips',name:'Fried Pickle Chips',price:3.49}
      ],
      Drinks:[
        {id:'crown_cola',name:'Crown Cola',price:2.69},
        {id:'crown_zero',name:'Crown Zero',price:2.69},
        {id:'crown_cherry',name:'Crown Cherry',price:2.69},
        {id:'crown_vanilla',name:'Crown Vanilla',price:2.69},
        {id:'crown_citrus',name:'Crown Citrus',price:2.69},
        {id:'crown_orange',name:'Crown Orange',price:2.69},
        {id:'crown_cream',name:'Crown Cream',price:2.69},
        {id:'crown_root_beer',name:'Crown Root Beer',price:2.69},
        {id:'crown_black_cherry',name:'Crown Black Cherry',price:2.69},
        {id:'georgia_crown_peach',name:'Georgia Crown Peach',price:2.69},
        {id:'crown_sparkling',name:'Crown Sparkling Water',price:2.69},
        {id:'voltage',name:'Voltage Sports Drink',price:2.69}
      ]
    }
  },
  {
    id:'swans_nest', name:"The Swan's Nest", type:'Caribbean • Latin', eta:'30–40 min', fee:3.49,
    description:'Caribbean and Latin comfort food.',
    categories:{
      Appetizers:[
        {id:'ajiaco_soup',name:'Ajiaco Soup',price:17},
        {id:'comida_pr',name:'Comida de Puerto Rico',price:19},
        {id:'feed4_rice_pork_salad',name:'Feed 4 Rice and Pork Salad',price:24},
        {id:'feed4_crawfish_boil',name:'Feed 4 Crawfish Boil',price:40},
        {id:'feed2_seafood_boil',name:'Feed 2 Seafood Boil',price:45},
        {id:'seafood_paella',name:'Seafood Paella',price:33},
        {id:'shrimp_mofongo',name:'Shrimp Mofongo',price:15},
        {id:'trini_quesadillas',name:'Trini Styled Quesadillas',price:15},
        {id:'pernil_shoulder',name:'Pernil Pork Shoulder',price:52},
        {id:'feed4_oxtail',name:'Feed 4 Jamaican Oxtail Stew',price:55}
      ],
      Entrees:[
        {id:'chuleta',name:'Chuleta Pork Chop',price:24},
        {id:'trini_roti',name:'Trini Wrapped Roti',price:19},
        {id:'rice_pork_pernil',name:'Rice and Pork Pernil',price:12},
        {id:'crawfish_platter',name:'Feed 1 Crawfish Platter',price:22},
        {id:'seafood_platter',name:'Feed 1 Seafood Platter',price:24},
        {id:'seafood_paella_plate',name:'Seafood Paella Plate',price:18},
        {id:'oxtail_platter',name:'Oxtail Platter',price:27}
      ],
      Sides:[
        {id:'rice_peas',name:'Rice & Peas',price:7},
        {id:'plantains',name:'Plantains',price:5},
        {id:'yellow_rice',name:'Yellow Rice',price:7}
      ]
    }
  },
  {
    id:'nessas', name:"Nessa's Confections", type:'Bakery • Brunch', eta:'15–25 min', fee:2.49,
    description:'Brunch favorites, signature cupcakes & desserts.',
    categories:{
      Breakfast:[
        {id:'cougar_quesadilla',name:'Cougar Quesadilla',price:11},
        {id:'panther_pimento',name:'Panther Pimento',price:10},
        {id:'knights_feast',name:"Knight's Feast",price:12}
      ],
      Cupcakes:[
        {id:'dames_devils_food',name:"Dame's Devil's Food Delight",price:7.50},
        {id:'dejs_double_choc',name:"Dèj's Double Chocolate",price:7.95},
        {id:'owens_icebox',name:"Owen's Icebox",price:6.25},
        {id:'sonni_girl',name:'Sonni Girl Strawberry Dream',price:7.25},
        {id:'full_nelson',name:'#AFullNelson Italian Cream Cake',price:7.25},
        {id:'bestie_banana',name:'Bestie Banana',price:7.50},
        {id:'brinson_bourbon',name:'Brinson Bourbon',price:7.75},
        {id:'mama_mels_mud',name:"Mama Mel's Mississippi Mud",price:7.75},
        {id:'mamas_day_out',name:"Mama's Day Out",price:6.50},
        {id:'cc_cinnamon',name:"CC's Cinnamon Kiss",price:6.75}
      ],
      Desserts:[
        {id:'cobbler',name:'Cobbler',price:3},
        {id:'lemon_bar',name:'Lemon Bar',price:2},
        {id:'banana_pudding',name:'Banana Pudding',price:3},
        {id:'ooey_gooey',name:'Ooey Gooey Bar',price:3},
        {id:'cookies',name:'Cookies',price:2.50}
      ]
    }
  },
  {
    id:'gabries', name:"Gabrie's Dominican Soul", type:'Dominican', eta:'30–45 min', fee:3.99,
    description:'Dominican classics, platters & comfort food.',
    categories:{
      Starters:[
        {id:'chimi_sliders',name:'Chimi Patacon Sliders',price:18.90},
        {id:'chicharrones_pollo',name:'Chicharrones de Pollo',price:10.90},
        {id:'tostones_rellenos',name:'Tostones Rellenos de Pollo Guisado',price:10.90},
        {id:'yaroa',name:'Yaroa de Pollo Guisado o de Carne Molida',price:8.90},
        {id:'pastelito',name:'Pollo Guisado Pastelito o Carne Molida Pastelito',price:10.90}
      ],
      Sides:[
        {id:'maduros',name:'Maduros',price:4.90},
        {id:'yuca_frita',name:'Yuca Frita',price:5.90},
        {id:'arroz',name:'Arroz Blanco o Amarillo',price:8.90},
        {id:'moro_coco',name:'Moro con Coco',price:8.90},
        {id:'sancocho',name:'Sancocho',price:12.90},
        {id:'ensalada_verde',name:'Ensalada Verde Dominicana',price:5.90},
        {id:'tostones',name:'Tostones',price:8.90}
      ],
      Mains:[
        {id:'pica_pollo',name:'Pica Pollo avec Arroz Blanco con Habichuelas',price:26.50},
        {id:'mar_tierra',name:'Mar y Tierra / Churrasco y Camarones',price:28},
        {id:'berenjena',name:'Berenjena Guisada',price:14},
        {id:'pollo_guisado',name:'Pollo Guisado',price:18.90},
        {id:'res_guisado',name:'Res Guisado',price:20.90},
        {id:'salmon_plancha',name:'Salmon a la Plancha',price:20},
        {id:'gabries_sampler',name:"Gabrie's Sampler",price:48.90},
        {id:'filet_tacos',name:'Filet Mignon Tacos',price:17}
      ]
    }
  },
  {
    id:'aguilar', name:'Aguilar Convenience', type:'Convenience Store', eta:'10–20 min', fee:1.99,
    description:'Snacks, drinks, essentials & late-night saves.',
    categories:{
      Drinks:[
        {id:'ag_crown_cola',name:'Crown Cola',price:2.49},
        {id:'ag_water',name:'Bottled Water',price:1.79},
        {id:'ag_voltage',name:'Voltage Sports Drink',price:2.99},
        {id:'ag_juice',name:'Fruit Juice',price:2.79}
      ],
      Snacks:[
        {id:'ag_chips',name:'Potato Chips',price:2.49},
        {id:'ag_cookies',name:'Cookies',price:2.99},
        {id:'ag_candy',name:'Candy Bar',price:1.89},
        {id:'ag_popcorn',name:'Microwave Popcorn',price:2.49}
      ],
      QuickMeals:[
        {id:'ag_noodles',name:'Instant Noodles',price:1.99},
        {id:'ag_pizza',name:'Frozen Pizza',price:7.99},
        {id:'ag_breakfast_sandwich',name:'Breakfast Sandwich',price:4.99}
      ],
      Essentials:[
        {id:'ag_toothpaste',name:'Toothpaste',price:4.49},
        {id:'ag_deodorant',name:'Deodorant',price:5.99},
        {id:'ag_paper_towels',name:'Paper Towels',price:4.99},
        {id:'ag_toilet_paper',name:'Toilet Paper',price:6.99},
        {id:'ag_charger',name:'Phone Charger',price:14.99},
        {id:'ag_batteries',name:'Batteries',price:7.99}
      ]
    }
  }
];

export const findBusiness = id => businesses.find(b => b.id === id);
export const findItem = (business, itemId) =>
  Object.values(business.categories).flat().find(i => i.id === itemId);
