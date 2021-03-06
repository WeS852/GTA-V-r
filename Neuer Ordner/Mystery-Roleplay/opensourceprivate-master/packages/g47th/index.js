let impound = mp.colshapes.newSphere(447.969970703125, 239.63230895996094, 103.2106704711914, 5, 0);
mp.events.add("PushE", (player) => {
  if (mp.players.exists(player)) {
    if(impound.isPointWithin(player.position)) {
        if (player.data.gang == "G47Th") {
           player.call("client:g47:openMainMenu");
           //player.data.mainmenu = true;
        } else {
            player.notify("~r~Verpiss dich du hast Kein Recht hier zusein!");
        }        
    }    
  }
});

mp.events.add("server:g47:openMenu",(player) => {
    gm.mysql.handle.query("SELECT v.*, c.firstname, c.lastname FROM vehicles v LEFT JOIN characters c ON c.id = v.charId WHERE v.impounded = '9'",[],function(err,res) {
        if (err) console.log("Error in Select G47Th Vehicles: "+err);
        if (res.length > 0) {
            var i = 1;
            let vehList = [];
            res.forEach(function(veh) {
                let obj = {"model": String(veh.model), "id": String(veh.id), "kennzeichen": String(veh.numberPlate), "firstname": String(veh.firstname),"lastname": String(veh.lastname)};
                vehList.push(obj);
                if (parseInt(i) == parseInt(res.length)) {
                    if(mp.players.exists(player)) player.call("client:g47:openMenu", [JSON.stringify(vehList)]);
                }
                i++;
            });
        } else {
            player.notify("~r~Keine Fahrzeuge in der G47Th Garage");
        }
    });
});


mp.events.add("server:g47:parkout",(player,id) => {
    const one = new mp.Vector3(459.2955322265625, 242.64181518554688, 103.20968627929688);
    const onehead = 39;
    gm.mysql.handle.query("SELECT * FROM vehicles WHERE id = ?",[id],function(err1,res1) {
        if (err1) console.log("Error in Select Vehicles on g47: "+err1);
        if (getVehicleFromPosition(one, 3).length > 0) {
            player.notify("~r~Spawn is not Free");
        } else {
            var veh = mp.vehicles.new(res1[0].model, one, {
                heading: onehead,
                numberPlate: res1[0].numberPlate,
                locked: true,
                engine: false,
                dimension: 0
        });           
            gm.mysql.handle.query("UPDATE vehicles SET parked = '0',impounded = '0' WHERE id = ?",[id],function (err2,res2) {
                if (err2) console.log("Error in Update vehicles: "+err);   
                if (mp.vehicles.exists(veh)) {
                    veh.setVariable("vehId",res1[0].id);
                    veh.setVariable("fuel",res1[0].fill);
                    veh.setVariable("fuelart",res1[0].fuelart);
                    veh.setVariable("isDead",res1[0].dead);
                    veh.setVariable('Kilometer',res1[0].km);
                    veh.setVariable("tanken","false");
                    veh.neonEnabled = false;
                    veh.setNeonColor(parseInt(res1[0].neonr), parseInt(res1[0].neong), parseInt(res1[0].neonb));
                    veh.setColor(res1[0].pcolor, res1[0].scolor);
                    veh.setMod(48, res1[0].design);
                    veh.setMod(0, res1[0].spoiler);
                    veh.setMod(1, res1[0].front);
                    veh.setMod(2, res1[0].heck);
                    veh.setMod(3, res1[0].seite);
                    veh.setMod(4, res1[0].auspuff);
                    veh.setMod(5, res1[0].rahmen);
                    veh.setMod(6, res1[0].gitter);
                    veh.setMod(7, res1[0].haube);
                    veh.setMod(8, res1[0].kotfl);
                    veh.setMod(10, res1[0].dach);
                    veh.setMod(11, res1[0].motor);
                    veh.setMod(12, res1[0].bremsen);
                    veh.setMod(13, res1[0].getriebe);
                    veh.setMod(14, res1[0].hupe);
                    veh.setMod(15, res1[0].feder);
                    veh.setMod(18, res1[0].turbo);
                    veh.setMod(22, res1[0].xenon);
                    veh.setMod(23, res1[0].felgen);
                    veh.wheelColor = res1[0].wheelColor;
                    veh.windowTint = res1[0].windowTint;
                    veh.numberPlateType = 1;
                    veh.numberPlate = String(res1[0].numberPlate);
                    veh.engine = false;
                    player.notify("~g~Das Fahrzeug wurde ausgeparkt");  
                }                         
                
            });                        
        }
    });    
});

mp.events.add("server:g47:parkin", (player,id) => {
        const pos = new mp.Vector3(465.3695068359375, 230.34359741210938, 103.20974731445312);
        const veh = getVehicleFromPosition(pos, 2)[0];
        if (mp.vehicles.exists(veh)) {
        if (veh === null) {
            player.notify("~r~Kein Fahrzeug in der Einfahrt");
            return;
        }             
        gm.mysql.handle.query("UPDATE vehicles SET parked = '1', impounded = '9' WHERE id = ?",[veh.getVariable("vehId")], function(err2,res2) {
            if (err2) console.log("Error in Update Vehicles: "+err2);
            veh.destroy();
        });       
    }
});

function getVehicleFromPosition(position, range) {
    const returnVehicles = [];

    mp.vehicles.forEachInRange(position, range,
        (vehicle) => {
            returnVehicles.push(vehicle);
        }
    );
    return returnVehicles;
}